using System.Collections.Generic;
using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Salas;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Salas.Queries;

public record GetSalasQuery(Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<IEnumerable<SalaDto>>>;

public class GetSalasQueryHandler(IAppDbContext context)
    : IRequestHandler<GetSalasQuery, ErrorOr<IEnumerable<SalaDto>>>
{
    public async Task<ErrorOr<IEnumerable<SalaDto>>> Handle(GetSalasQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var salas = await context.Salas
            .AsNoTracking()
            .Where(s => s.ConferenciaId == query.ConferenciaId)
            .OrderBy(s => s.Nombre)
            .Select(s => new SalaDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Capacidad = s.Capacidad,
                CreadoEn = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return salas;
    }
}
