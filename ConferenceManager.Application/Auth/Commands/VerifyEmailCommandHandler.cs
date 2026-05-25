using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Auth.Commands;

public class VerifyEmailCommandHandler(IAppDbContext context)
    : IRequestHandler<VerifyEmailCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(VerifyEmailCommand command, CancellationToken cancellationToken)
    {
        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(u => u.VerificationToken == command.Token, cancellationToken);

        if (usuario is null)
            return Error.Validation("TOKEN_INVALID", "El token de verificación no es válido.");

        if (usuario.VerificationTokenExpiresAt < DateTime.UtcNow)
            return Error.Validation("TOKEN_EXPIRED", "El token de verificación ha expirado.");

        usuario.EmailVerificado = true;
        usuario.VerificationToken = null;
        usuario.VerificationTokenExpiresAt = null;

        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
