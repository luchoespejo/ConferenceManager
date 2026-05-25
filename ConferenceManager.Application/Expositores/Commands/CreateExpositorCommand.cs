using System.Text.Json;
using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Application.Expositores.Common;
using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Expositores.Commands;

public record CreateExpositorCommand(Guid ConferenciaId, Guid UsuarioId, CreateExpositorDto Dto)
    : IRequest<ErrorOr<ExpositorDetalleDto>>;

public class CreateExpositorCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateExpositorCommand, ErrorOr<ExpositorDetalleDto>>
{
    public async Task<ErrorOr<ExpositorDetalleDto>> Handle(CreateExpositorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var dto = command.Dto;
        var expositor = new Expositor
        {
            Id = Guid.NewGuid(),
            ConferenciaId = command.ConferenciaId,
            Nombre = dto.Nombre,
            Bio = dto.Bio,
            FotoUrl = dto.FotoUrl,
            Email = dto.Email,
            RedesSociales = dto.RedesSociales != null ? JsonSerializer.SerializeToDocument(dto.RedesSociales) : null,
            TokenAcceso = Guid.NewGuid().ToString()
        };

        context.Expositores.Add(expositor);
        await context.SaveChangesAsync(cancellationToken);

        return ExpositorMapper.MapToDetalle(expositor);
    }
}
