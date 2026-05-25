using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.FechasImportantes.Commands;

public record DeleteFechaImportanteCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<Success>>;

public class DeleteFechaImportanteCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteFechaImportanteCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteFechaImportanteCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var fecha = await context.FechasImportantes
            .FirstOrDefaultAsync(f => f.Id == command.Id && f.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (fecha is null)
            return Error.NotFound("FECHA_NOT_FOUND", "La fecha importante no existe o no pertenece al congreso especificado.");

        context.FechasImportantes.Remove(fecha);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
