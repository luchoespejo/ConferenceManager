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
    opt.UseNpgsql(connectionString, npgsqlOpt =>
        npgsqlOpt.EnableRetryOnFailure(maxRetryCount: 3)));

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
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey))
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAdminClient", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy
                .WithOrigins("http://localhost:3000", "http://localhost:4200", "http://localhost:3001")
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy
                .WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});

// ── HTTP Client ───────────────────────────────────────────────────────────────
builder.Services.AddHttpClient("ResendClient");

// ── Application Services ──────────────────────────────────────────────────────
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

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IConferenciaService, ConferenciaService>();
builder.Services.AddScoped<ISalaService, SalaService>();
builder.Services.AddScoped<IExpositorService, ExpositorService>();
builder.Services.AddScoped<ISesionService, SesionService>();
builder.Services.AddScoped<IPublicService, PublicService>();

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

// ── Migrate + Seed (dev only) ─────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
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

app.UseCors("AllowAdminClient");
app.UseAuthentication();
app.UseAuthorization();
app.UseHttpsRedirection();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/seed", async (AppDbContext db) =>
{
    if (!app.Environment.IsDevelopment()) return Results.Forbid();
    await SeedData.SeedAsync(db);
    return Results.Ok(new { message = "Seeded OK" });
});

app.MapControllers();

app.Run();
