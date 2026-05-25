using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.FechasImportantes;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.FechasImportantes.Commands;

public record CreateFechaImportanteCommand(Guid ConferenciaId, Guid UsuarioId, CreateFechaImportanteDto Dto)
    : IRequest<ErrorOr<FechaImportanteDto>>;

public class CreateFechaImportanteCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateFechaImportanteCommand, ErrorOr<FechaImportanteDto>>
{
    public async Task<ErrorOr<FechaImportanteDto>> Handle(CreateFechaImportanteCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var fecha = new FechaImportante
        {
            ConferenciaId = command.ConferenciaId,
            Descripcion = command.Dto.Descripcion,
            Fecha = command.Dto.Fecha,
            FechaFin = command.Dto.FechaFin
        };

        context.FechasImportantes.Add(fecha);
        await context.SaveChangesAsync(cancellationToken);

        return new FechaImportanteDto
        {
            Id = fecha.Id,
            Descripcion = fecha.Descripcion,
            Fecha = fecha.Fecha,
            FechaFin = fecha.FechaFin
        };
    }
}
