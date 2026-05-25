using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.EjesTematicos.Commands;

public record DeleteEjeTematicoCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<Success>>;

public class DeleteEjeTematicoCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteEjeTematicoCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteEjeTematicoCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var eje = await context.EjesTematicos
            .FirstOrDefaultAsync(e => e.Id == command.Id && e.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (eje is null)
            return Error.NotFound("EJE_NOT_FOUND", "El eje temático no existe o no pertenece al congreso especificado.");

        context.EjesTematicos.Remove(eje);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
