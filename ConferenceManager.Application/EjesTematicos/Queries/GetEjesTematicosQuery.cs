using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.EjesTematicos;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.EjesTematicos.Queries;

public record GetEjesTematicosQuery(Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<IEnumerable<EjeTematicoDto>>>;

public class GetEjesTematicosQueryHandler(IAppDbContext context)
    : IRequestHandler<GetEjesTematicosQuery, ErrorOr<IEnumerable<EjeTematicoDto>>>
{
    public async Task<ErrorOr<IEnumerable<EjeTematicoDto>>> Handle(GetEjesTematicosQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var lista = await context.EjesTematicos
            .AsNoTracking()
            .Where(e => e.ConferenciaId == query.ConferenciaId)
            .Select(e => new EjeTematicoDto { Id = e.Id, Nombre = e.Nombre })
            .ToListAsync(cancellationToken);

        return lista;
    }
}
