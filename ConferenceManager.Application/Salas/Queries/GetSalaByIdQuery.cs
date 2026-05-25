using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Salas;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Salas.Queries;

public record GetSalaByIdQuery(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<SalaDto>>;

public class GetSalaByIdQueryHandler(IAppDbContext context)
    : IRequestHandler<GetSalaByIdQuery, ErrorOr<SalaDto>>
{
    public async Task<ErrorOr<SalaDto>> Handle(GetSalaByIdQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("SALA_NOT_FOUND", "La sala no existe o no pertenece al congreso especificado.");

        var sala = await context.Salas
            .AsNoTracking()
            .Where(s => s.Id == query.Id && s.ConferenciaId == query.ConferenciaId)
            .Select(s => new SalaDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Capacidad = s.Capacidad,
                CreadoEn = s.CreatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        return sala is null
            ? Error.NotFound("SALA_NOT_FOUND", "La sala no existe o no pertenece al congreso especificado.")
            : sala;
    }
}
