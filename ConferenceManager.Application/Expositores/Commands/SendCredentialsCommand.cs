using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Services;
using ErrorOr;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Commands;

public record SendCredentialsCommand(Guid ConferenciaId, Guid UsuarioId, Guid[]? ExpositorIds)
    : IRequest<ErrorOr<SendCredentialsResult>>;

public record SendCredentialsResult(string Message);

public class SendCredentialsCommandHandler(
    IAppDbContext context,
    IEmailService emailService,
    IConfiguration config) : IRequestHandler<SendCredentialsCommand, ErrorOr<SendCredentialsResult>>
{
    public async Task<ErrorOr<SendCredentialsResult>> Handle(SendCredentialsCommand command, CancellationToken cancellationToken)
    {
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (conferencia is null)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var organizadorEmail = await context.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == command.UsuarioId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync(cancellationToken);

        var expositorIds = command.ExpositorIds?.Any() == true
            ? command.ExpositorIds.ToList()
            : await context.Expositores
                .AsNoTracking()
                .Where(e => e.ConferenciaId == command.ConferenciaId)
                .Select(e => e.Id)
                .ToListAsync(cancellationToken);

        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.ConferenciaId == command.ConferenciaId && expositorIds.Contains(e.Id))
            .ToListAsync(cancellationToken);

        if (expositores.Count == 0)
            return Error.Validation("NO_EXPOSITORES", "No hay expositores para enviar credenciales.");

        var siteUrl = config["App:SiteUrl"] ?? "http://localhost:3000";
        var successCount = 0;

        foreach (var expositor in expositores)
        {
            if (string.IsNullOrEmpty(expositor.Email))
                continue;

            var accessUrl = $"{siteUrl}/expositor/{expositor.TokenAcceso}";
            var subject = $"Credenciales de acceso - {conferencia.Nombre}";
            var body = $@"
Hola {expositor.Nombre},

Te invitamos a acceder al panel de expositores de {conferencia.Nombre}.

Link de acceso: {accessUrl}

Este link es único para ti. No lo compartas.

¡Saludos!
";

            var emailSent = await emailService.SendAsync(expositor.Email, subject, body, replyTo: organizadorEmail, fromDisplayName: conferencia.Nombre);
            if (emailSent)
                successCount++;
        }

        return new SendCredentialsResult($"Se enviaron {successCount} de {expositores.Count} emails");
    }
}
