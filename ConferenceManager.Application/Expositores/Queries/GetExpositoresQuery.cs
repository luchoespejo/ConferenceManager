using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Expositores;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Queries;

public record GetExpositoresQuery(Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<IEnumerable<ExpositorListItemDto>>>;

public class GetExpositoresQueryHandler(IAppDbContext context)
    : IRequestHandler<GetExpositoresQuery, ErrorOr<IEnumerable<ExpositorListItemDto>>>
{
    public async Task<ErrorOr<IEnumerable<ExpositorListItemDto>>> Handle(GetExpositoresQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.ConferenciaId == query.ConferenciaId)
            .Select(e => new ExpositorListItemDto
            {
                Id = e.Id,
                ConferenciaId = e.ConferenciaId,
                Nombre = e.Nombre,
                Email = e.Email,
                FotoUrl = e.FotoUrl,
                TokenAcceso = e.TokenAcceso
            })
            .ToListAsync(cancellationToken);

        return expositores;
    }
}
