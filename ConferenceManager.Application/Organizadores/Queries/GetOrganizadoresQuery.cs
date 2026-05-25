using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Organizadores;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Organizadores.Queries;

public record GetOrganizadoresQuery(Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<IEnumerable<OrganizadorDto>>>;

public class GetOrganizadoresQueryHandler(IAppDbContext context)
    : IRequestHandler<GetOrganizadoresQuery, ErrorOr<IEnumerable<OrganizadorDto>>>
{
    public async Task<ErrorOr<IEnumerable<OrganizadorDto>>> Handle(GetOrganizadoresQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var lista = await context.Organizadores
            .AsNoTracking()
            .Where(o => o.ConferenciaId == query.ConferenciaId)
            .OrderBy(o => o.Orden)
            .Select(o => new OrganizadorDto
            {
                Id = o.Id,
                Nombre = o.Nombre,
                LogoUrl = o.LogoUrl,
                Orden = o.Orden
            })
            .ToListAsync(cancellationToken);

        return lista;
    }
}
