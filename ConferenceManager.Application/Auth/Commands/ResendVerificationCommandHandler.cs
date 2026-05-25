using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Services;
using ErrorOr;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Auth.Commands;

public class ResendVerificationCommandHandler(
    IAppDbContext context,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<ResendVerificationCommandHandler> logger) : IRequestHandler<ResendVerificationCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ResendVerificationCommand command, CancellationToken cancellationToken)
    {
        var usuario = await context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == command.Email, cancellationToken);

        // Return success even if user doesn't exist or is already verified (no information disclosure)
        if (usuario is null || usuario.EmailVerificado)
            return Result.Success;

        var newToken = Guid.NewGuid().ToString("N");
        usuario.VerificationToken = newToken;
        usuario.VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);

        await context.SaveChangesAsync(cancellationToken);

        var baseUrl = configuration["App:BaseUrl"] ?? "http://localhost:5001";
        var verificationUrl = $"{baseUrl}/api/auth/verificar-email?token={newToken}";

        try
        {
            await emailService.SendVerificationEmailAsync(command.Email, usuario.Nombre, verificationUrl);
        }
        catch (EmailDeliveryException ex)
        {
            logger.LogWarning(ex, "Failed to resend verification email to {Email}", command.Email);
        }

        return Result.Success;
    }
}
