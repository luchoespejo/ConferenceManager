using ConferenceManager.Data;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Startup validation ──────────────────────────────────────────────────────
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Jwt:SecretKey is not configured.");
if (jwtSecretKey.Length < 32)
    throw new InvalidOperationException("Jwt:SecretKey must be at least 32 characters.");

var appBaseUrl = builder.Configuration["App:BaseUrl"]
    ?? throw new InvalidOperationException("App:BaseUrl is not configured.");
if (string.IsNullOrWhiteSpace(appBaseUrl))
    throw new InvalidOperationException("App:BaseUrl cannot be empty.");

// ── Database ─────────────────────────────────────────────────────────────────
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseNpgsql(connectionString, npgsqlOpt =>
        npgsqlOpt.EnableRetryOnFailure(maxRetryCount: 3));
    opt.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});
// Clean Architecture: handlers depend on IAppDbContext (Application), resolved to AppDbContext (Infrastructure)
builder.Services.AddScoped<ConferenceManager.Application.Common.Interfaces.IAppDbContext>(
    sp => sp.GetRequiredService<AppDbContext>());
// MediatR scans the Application assembly for IRequestHandler<,> implementations
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(ConferenceManager.Application.Common.Interfaces.IAppDbContext).Assembly));

// ── Authentication ────────────────────────────────────────────────────────────
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidateIssuerSigningKey = false,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllDev", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .SetIsOriginAllowed(origin => true)
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    });
});

// ── HTTP Client ───────────────────────────────────────────────────────────────
builder.Services.AddHttpClient("ResendClient");
builder.Services.AddHttpClient<IStaticSiteService, StaticSiteService>();

// ── Application Services ──────────────────────────────────────────────────────
// CQRS Handlers
// Auth + Files slices migrated to Application (MediatR + ErrorOr) — resolved via AddMediatR
builder.Services.AddScoped<ConferenceManager.Features.Dashboard.Commands.IUpdateConferenciaCommandHandler, ConferenceManager.Features.Dashboard.Commands.UpdateConferenciaCommandHandler>();

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IQrService>(provider =>
{
    var logger = provider.GetRequiredService<ILogger<QrService>>();
    return new QrService(logger);
});

if (builder.Configuration.GetValue<bool>("Email:UseFake"))
    builder.Services.AddScoped<IEmailService, FakeEmailService>();
else
    builder.Services.AddScoped<IEmailService, ResendEmailService>();

builder.Services.AddScoped<IConferenciaService, ConferenciaService>();
builder.Services.AddScoped<ISesionService, SesionService>();
builder.Services.AddScoped<IPublicService, PublicService>();
builder.Services.AddScoped<IGithubPublishService, GithubPublishService>();
builder.Services.AddScoped<IParticipanteService, ParticipanteService>();
builder.Services.AddScoped<IAvisoUrgenteService, AvisoUrgenteService>();

// ── Controllers + Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "ConferenceManager API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ── Migrate + Seed ────────────────────────────────────────────────────────────
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await SeedData.SeedAsync(db);
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
    context.Response.Headers.Add("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }
    await next();
});

app.UseCors(policy =>
{
    if (app.Environment.IsDevelopment())
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    }
});
app.UseAuthentication();
app.UseAuthorization();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/test-endpoint", () => Results.Ok(new { test = "endpoint works" }));
app.MapPost("/api/test-post", () => Results.Ok(new { test = "post works" }));

app.MapPost("/api/seed", async (AppDbContext db) =>
{
    if (!app.Environment.IsDevelopment()) return Results.Forbid();
    await SeedData.SeedAsync(db);
    return Results.Ok(new { message = "Seeded OK" });
});

try
{
    var endpoint = app.MapControllers();
    app.Logger.LogInformation($"Controllers mapped successfully. Endpoint: {endpoint}");
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Failed to map controllers");
    throw;
}

app.Run();
