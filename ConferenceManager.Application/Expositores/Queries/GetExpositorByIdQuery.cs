using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Application.Expositores.Common;
using ConferenceManager.DTOs.Expositores;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Queries;

public record GetExpositorByIdQuery(Guid Id, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<ExpositorDetalleDto>>;

public class GetExpositorByIdQueryHandler(IAppDbContext context)
    : IRequestHandler<GetExpositorByIdQuery, ErrorOr<ExpositorDetalleDto>>
{
    public async Task<ErrorOr<ExpositorDetalleDto>> Handle(GetExpositorByIdQuery query, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == query.ConferenciaId && c.UsuarioId == query.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var expositor = await context.Expositores
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == query.Id && e.ConferenciaId == query.ConferenciaId, cancellationToken);

        if (expositor is null)
            return Error.NotFound("EXPOSITOR_NOT_FOUND", "El expositor no existe o no pertenece al congreso especificado.");

        return ExpositorMapper.MapToDetalle(expositor);
    }
}
