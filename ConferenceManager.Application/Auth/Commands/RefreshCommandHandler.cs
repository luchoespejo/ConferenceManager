using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Auth;
using ConferenceManager.Models;
using ConferenceManager.Services;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Auth.Commands;

public class RefreshCommandHandler(IAppDbContext context, IJwtService jwtService)
    : IRequestHandler<RefreshCommand, ErrorOr<LoginResponse>>
{
    public async Task<ErrorOr<LoginResponse>> Handle(RefreshCommand command, CancellationToken cancellationToken)
    {
        var hash = jwtService.HashRefreshToken(command.RefreshToken);

        var tokenEntity = await context.RefreshTokens
            .Include(rt => rt.Usuario)
            .FirstOrDefaultAsync(rt =>
                rt.TokenHash == hash &&
                !rt.Revoked &&
                rt.ExpiresAt > DateTime.UtcNow, cancellationToken);

        if (tokenEntity is null)
            return Error.Unauthorized("REFRESH_TOKEN_INVALID", "Refresh token inválido o expirado.");

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

        await context.SaveChangesAsync(cancellationToken);

        var usuarioInfo = new UsuarioInfo(tokenEntity.Usuario.Id, tokenEntity.Usuario.Email, tokenEntity.Usuario.Nombre, tokenEntity.Usuario.Organizacion);
        return new LoginResponse(newAccessToken, newRefreshTokenRaw, 900, usuarioInfo);
    }
}
