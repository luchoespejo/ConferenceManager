using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Salas.Commands;

public record DeleteSalaCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<Success>>;

public class DeleteSalaCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteSalaCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteSalaCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var sala = await context.Salas
            .FirstOrDefaultAsync(s => s.Id == command.Id && s.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (sala is null)
            return Error.NotFound("SALA_NOT_FOUND", "La sala no existe o no pertenece al congreso especificado.");

        var tieneSesiones = await context.Sesiones.AnyAsync(s => s.SalaId == command.Id, cancellationToken);

        if (tieneSesiones)
            return Error.Conflict("CANNOT_DELETE_WITH_SESIONES", "No se puede eliminar una sala con sesiones asignadas.");

        context.Salas.Remove(sala);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
