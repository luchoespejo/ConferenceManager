using ConferenceManager.Data;
using ConferenceManager.DTOs.Auth;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ConferenceManager.Services;

public class AuthService(
    AppDbContext context,
    IJwtService jwtService,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    public async Task<ServiceResult> RegistrarAsync(RegistroRequest dto)
    {
        // Check email uniqueness
        var exists = await context.Usuarios
            .AsNoTracking()
            .AnyAsync(u => u.Email == dto.Email);

        if (exists)
            return ServiceResult.Fail(AuthErrorCodes.EmailAlreadyExists, "El email ya está registrado.");

        // Validate password contains at least one digit
        if (!Regex.IsMatch(dto.Password, @"\d"))
            return ServiceResult.Fail("INVALID_PASSWORD", "La contraseña debe contener al menos un número.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);
        var verificationToken = Guid.NewGuid().ToString("N"); // 32 hex chars

        var usuario = new Usuario
        {
            Email = dto.Email,
            PasswordHash = passwordHash,
            Nombre = dto.Nombre,
            Organizacion = dto.Organizacion ?? string.Empty,
            EmailVerificado = false,
            VerificationToken = verificationToken,
            VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync();

        var baseUrl = configuration["App:BaseUrl"] ?? "http://localhost:5001";
        var verificationUrl = $"{baseUrl}/api/auth/verificar-email?token={verificationToken}";

        try
        {
            await emailService.SendVerificationEmailAsync(dto.Email, dto.Nombre, verificationUrl);
        }
        catch (EmailDeliveryException ex)
        {
            logger.LogWarning(ex, "Failed to send verification email to {Email}", dto.Email);
            // Registration succeeded; email failure is logged but not surfaced to client
        }

        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest dto)
    {
        var usuario = await context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        if (usuario is null)
        {
            // Timing-safe: consume BCrypt time even when user does not exist
            BCrypt.Net.BCrypt.HashPassword("dummy_timing_safe");
            return ServiceResult<LoginResponse>.Fail(AuthErrorCodes.InvalidCredentials, "Credenciales inválidas.");
        }

        if (!usuario.Activo)
            return ServiceResult<LoginResponse>.Fail(AuthErrorCodes.AccountDisabled, "Tu cuenta está deshabilitada. Contactá al administrador.");

        if (!usuario.EmailVerificado)
            return ServiceResult<LoginResponse>.Fail(AuthErrorCodes.EmailNotVerified, "Verificá tu email antes de iniciar sesión.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return ServiceResult<LoginResponse>.Fail(AuthErrorCodes.InvalidCredentials, "Credenciales inválidas.");

        var accessToken = jwtService.GenerateAccessToken(usuario);
        var refreshTokenRaw = jwtService.GenerateRefreshTokenRaw();
        var tokenHash = jwtService.HashRefreshToken(refreshTokenRaw);

        var refreshToken = new RefreshToken
        {
            UsuarioId = usuario.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Revoked = false
        };

        context.RefreshTokens.Add(refreshToken);
        await context.SaveChangesAsync();

        var usuarioInfo = new UsuarioInfo(usuario.Id, usuario.Email, usuario.Nombre, usuario.Organizacion);
        return ServiceResult<LoginResponse>.Ok(new LoginResponse(accessToken, refreshTokenRaw, 900, usuarioInfo));
    }

    public async Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshTokenRaw)
    {
        var hash = jwtService.HashRefreshToken(refreshTokenRaw);

        var tokenEntity = await context.RefreshTokens
            .Include(rt => rt.Usuario)
            .FirstOrDefaultAsync(rt =>
                rt.TokenHash == hash &&
                !rt.Revoked &&
                rt.ExpiresAt > DateTime.UtcNow);

        if (tokenEntity is null)
            return ServiceResult<LoginResponse>.Fail(AuthErrorCodes.RefreshTokenInvalid, "Refresh token inválido o expirado.");

        tokenEntity.Revoked = true;

        var newRefreshTokenRaw = jwtService.GenerateRefreshTokenRaw();
        var newHash = jwtService.HashRefreshToken(newRefreshTokenRaw);

        var newRefreshToken = new RefreshToken
        {
            UsuarioId = tokenEntity.UsuarioId,
            TokenHash = newHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            Revoked = false
        };

        context.RefreshTokens.Add(newRefreshToken);

        var newAccessToken = jwtService.GenerateAccessToken(tokenEntity.Usuario);

        await context.SaveChangesAsync();

        var usuarioInfo = new UsuarioInfo(tokenEntity.Usuario.Id, tokenEntity.Usuario.Email, tokenEntity.Usuario.Nombre, tokenEntity.Usuario.Organizacion);
        return ServiceResult<LoginResponse>.Ok(new LoginResponse(newAccessToken, newRefreshTokenRaw, 900, usuarioInfo));
    }

    public async Task<ServiceResult> VerificarEmailAsync(string token)
    {
        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(u => u.VerificationToken == token);

        if (usuario is null)
            return ServiceResult.Fail(AuthErrorCodes.TokenInvalid, "El token de verificación no es válido.");

        if (usuario.VerificationTokenExpiresAt < DateTime.UtcNow)
            return ServiceResult.Fail(AuthErrorCodes.TokenExpired, "El token de verificación ha expirado.");

        usuario.EmailVerificado = true;
        usuario.VerificationToken = null;
        usuario.VerificationTokenExpiresAt = null;

        await context.SaveChangesAsync();

        return ServiceResult.Ok();
    }

    public async Task<ServiceResult> ReenviarVerificacionAsync(string email)
    {
        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);

        // Return OK even if user doesn't exist or is already verified (no information disclosure)
        if (usuario is null || usuario.EmailVerificado)
            return ServiceResult.Ok();

        var newToken = Guid.NewGuid().ToString("N");
        usuario.VerificationToken = newToken;
        usuario.VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await context.SaveChangesAsync();

        var baseUrl = configuration["App:BaseUrl"] ?? "http://localhost:5001";
        var verificationUrl = $"{baseUrl}/api/auth/verificar-email?token={newToken}";

        try
        {
            await emailService.SendVerificationEmailAsync(email, usuario.Nombre, verificationUrl);
        }
        catch (EmailDeliveryException ex)
        {
            logger.LogWarning(ex, "Failed to resend verification email to {Email}", email);
        }

        return ServiceResult.Ok();
    }
}
