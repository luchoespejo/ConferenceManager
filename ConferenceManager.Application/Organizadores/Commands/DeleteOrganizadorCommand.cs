using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Organizadores.Commands;

public record DeleteOrganizadorCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<Success>>;

public class DeleteOrganizadorCommandHandler(IAppDbContext context)
    : IRequestHandler<DeleteOrganizadorCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteOrganizadorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var organizador = await context.Organizadores
            .FirstOrDefaultAsync(o => o.Id == command.Id && o.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (organizador is null)
            return Error.NotFound("ORGANIZADOR_NOT_FOUND", "El organizador no existe o no pertenece al congreso especificado.");

        context.Organizadores.Remove(organizador);
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success;
    }
}
