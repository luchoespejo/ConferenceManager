using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Auth;
using ConferenceManager.Models;
using ConferenceManager.Services;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Auth.Commands;

public class LoginCommandHandler(IAppDbContext context, IJwtService jwtService)
    : IRequestHandler<LoginCommand, ErrorOr<LoginResponse>>
{
    public async Task<ErrorOr<LoginResponse>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var usuario = await context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == command.Email, cancellationToken);

        if (usuario is null)
        {
            // Timing-safe: consume BCrypt time even when user does not exist
            BCrypt.Net.BCrypt.HashPassword("dummy_timing_safe");
            return Error.Unauthorized("INVALID_CREDENTIALS", "Credenciales inválidas.");
        }

        if (!usuario.Activo)
            return Error.Forbidden("ACCOUNT_DISABLED", "Tu cuenta está deshabilitada. Contactá al administrador.");

        if (!usuario.EmailVerificado)
            return Error.Forbidden("EMAIL_NOT_VERIFIED", "Verificá tu email antes de iniciar sesión.");

        if (!BCrypt.Net.BCrypt.Verify(command.Password, usuario.PasswordHash))
            return Error.Unauthorized("INVALID_CREDENTIALS", "Credenciales inválidas.");

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
        await context.SaveChangesAsync(cancellationToken);

        var usuarioInfo = new UsuarioInfo(usuario.Id, usuario.Email, usuario.Nombre, usuario.Organizacion);
        return new LoginResponse(accessToken, refreshTokenRaw, 86400, usuarioInfo);
    }
}
