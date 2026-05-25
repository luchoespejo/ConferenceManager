using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.FechasImportantes;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.FechasImportantes.Queries;

public record GetFechasImportantesQuery(Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<IEnumerable<FechaImportanteDto>>>;

public class GetFechasImportantesQueryHandler(IAppDbContext context)
    : IRequestHandler<GetFechasImportantesQuery, ErrorOr<IEnumerable<FechaImportanteDto>>>
{
    public async Task<ErrorOr<IEnumerable<FechaImportanteDto>>> Handle(GetFechasImportantesQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var lista = await context.FechasImportantes
            .AsNoTracking()
            .Where(f => f.ConferenciaId == query.ConferenciaId)
            .OrderBy(f => f.Fecha)
            .Select(f => new FechaImportanteDto
            {
                Id = f.Id,
                Descripcion = f.Descripcion,
                Fecha = f.Fecha,
                FechaFin = f.FechaFin
            })
            .ToListAsync(cancellationToken);

        return lista;
    }
}
