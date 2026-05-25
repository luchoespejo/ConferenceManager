using System.Text.Json;
using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Application.Expositores.Common;
using ConferenceManager.DTOs.Expositores;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Commands;

public record UpdateExpositorCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId, UpdateExpositorDto Dto)
    : IRequest<ErrorOr<ExpositorDetalleDto>>;

public class UpdateExpositorCommandHandler(IAppDbContext context)
    : IRequestHandler<UpdateExpositorCommand, ErrorOr<ExpositorDetalleDto>>
{
    public async Task<ErrorOr<ExpositorDetalleDto>> Handle(UpdateExpositorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var expositor = await context.Expositores
            .FirstOrDefaultAsync(e => e.Id == command.Id && e.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (expositor is null)
            return Error.NotFound("EXPOSITOR_NOT_FOUND", "El expositor no existe o no pertenece al congreso especificado.");

        var dto = command.Dto;
        if (dto.Nombre != null) expositor.Nombre = dto.Nombre;
        if (dto.Bio != null) expositor.Bio = dto.Bio;
        if (dto.FotoUrl != null) expositor.FotoUrl = dto.FotoUrl;
        if (dto.Email != null) expositor.Email = dto.Email;
        if (dto.RedesSociales != null) expositor.RedesSociales = JsonSerializer.SerializeToDocument(dto.RedesSociales);

        await context.SaveChangesAsync(cancellationToken);

        return ExpositorMapper.MapToDetalle(expositor);
    }
}
