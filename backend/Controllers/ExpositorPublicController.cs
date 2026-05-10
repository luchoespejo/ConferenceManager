using ConferenceManager.Data;
using ConferenceManager.Services;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/public/expositor")]
public class ExpositorPublicController(AppDbContext context, IConfiguration config) : ControllerBase
{
    [HttpPost("set-password/{token}")]
    public async Task<IActionResult> SetPassword(string token, [FromBody] SetPasswordRequest req)
    {
        var expositor = await context.Expositores
            .FirstOrDefaultAsync(e => e.TokenAcceso == token);

        if (expositor is null)
            return NotFound(new { error = "INVALID_TOKEN", message = "Token inválido" });

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        var existingCred = await context.ExpositorCredenciales
            .FirstOrDefaultAsync(c => c.ExpositorId == expositor.Id);

        if (existingCred is null)
        {
            var newCred = new ExpositorCredencial
            {
                Id = Guid.NewGuid(),
                ExpositorId = expositor.Id,
                Email = expositor.Email ?? $"expositor-{expositor.Id}@tuplataforma.com",
                PasswordHash = passwordHash
            };
            context.ExpositorCredenciales.Add(newCred);
        }
        else
        {
            existingCred.PasswordHash = passwordHash;
            context.ExpositorCredenciales.Update(existingCred);
        }

        await context.SaveChangesAsync();

        return Ok(new { message = "Contraseña establecida" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] ExpositorLoginRequest req)
    {
        var cred = await context.ExpositorCredenciales
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Email == req.Email);

        if (cred is null || !BCrypt.Net.BCrypt.Verify(req.Password, cred.PasswordHash))
            return Unauthorized(new { error = "INVALID_CREDENTIALS", message = "Email o contraseña inválido" });

        var expositor = await context.Expositores
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == cred.ExpositorId);

        if (expositor is null)
            return Unauthorized();

        var token = GenerateJwtForExpositor(expositor.Id, expositor.Email ?? expositor.Nombre);

        return Ok(new { accessToken = token, expositor = new { id = expositor.Id, nombre = expositor.Nombre, email = expositor.Email } });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return Unauthorized(new { error = "NO_TOKEN", message = "No token provided" });

        var token = authHeader.Substring("Bearer ".Length);
        Guid id;

        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3)
                return Unauthorized(new { error = "INVALID_TOKEN", message = "Token malformed" });

            var payload = parts[1];
            var padding = 4 - (payload.Length % 4);
            if (padding != 4) payload += new string('=', padding);

            var decodedBytes = Convert.FromBase64String(payload);
            var payloadJson = Encoding.UTF8.GetString(decodedBytes);

            using (var doc = System.Text.Json.JsonDocument.Parse(payloadJson))
            {
                if (!doc.RootElement.TryGetProperty("sub", out var subElement))
                    return Unauthorized(new { error = "INVALID_TOKEN", message = "Claim sub faltante" });

                var expositorId = subElement.GetString();
                if (string.IsNullOrEmpty(expositorId) || !Guid.TryParse(expositorId, out id))
                    return Unauthorized(new { error = "INVALID_TOKEN", message = "Expositor ID inválido" });
            }
        }
        catch (Exception ex)
        {
            return Unauthorized(new { error = "TOKEN_ERROR", message = ex.Message });
        }

        var expositor = await context.Expositores
            .AsNoTracking()
            .Include(e => e.Conferencia)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (expositor is null)
            return NotFound();

        var sesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.ExpositorId == id)
            .Include(s => s.Sala)
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraInicio)
            .Select(s => new
            {
                s.Id,
                s.Titulo,
                s.Descripcion,
                Fecha = s.Fecha.ToString("dd/MM/yyyy"),
                HoraInicio = s.HoraInicio,
                HoraFin = s.HoraFin,
                SalaNombre = s.Sala!.Nombre,
                s.Track,
                s.QrCodeUrl
            })
            .ToListAsync();

        return Ok(new
        {
            expositor = new
            {
                expositor.Id,
                expositor.Nombre,
                expositor.Email,
                expositor.Bio,
                expositor.FotoUrl
            },
            conferencia = new
            {
                expositor.Conferencia.Id,
                expositor.Conferencia.Nombre,
                expositor.Conferencia.Slug
            },
            Sesiones = sesiones
        });
    }

    private string GenerateJwtForExpositor(Guid expositorId, string email)
    {
        var jwtSecret = config["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey not configured");
        var jwtIssuer = config["Jwt:Issuer"] ?? "ConferenceManager";
        var jwtAudience = config["Jwt:Audience"] ?? "ConferenceManager";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("sub", expositorId.ToString()),
            new Claim("email", email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = credentials
        };

        var handler = new JsonWebTokenHandler();
        return handler.CreateToken(descriptor);
    }
}

public record SetPasswordRequest(string Password);
public record ExpositorLoginRequest(string Email, string Password);
