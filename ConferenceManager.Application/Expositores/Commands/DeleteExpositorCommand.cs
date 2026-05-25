using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Commands;

public record DeleteExpositorCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<Success>>;

public class DeleteExpositorCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteExpositorCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteExpositorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var expositor = await context.Expositores
            .FirstOrDefaultAsync(e => e.Id == command.Id && e.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (expositor is null)
            return Error.NotFound("EXPOSITOR_NOT_FOUND", "El expositor no existe o no pertenece al congreso especificado.");

        var tieneSesiones = await context.Sesiones.AnyAsync(s => s.ExpositorId == command.Id, cancellationToken);
        if (tieneSesiones)
            return Error.Conflict("CANNOT_DELETE_WITH_SESSIONS", "No se puede eliminar un expositor con sesiones asignadas.");

        context.Expositores.Remove(expositor);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
