using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.FechasImportantes;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.FechasImportantes.Commands;

public record UpdateFechaImportanteCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId, UpdateFechaImportanteDto Dto)
    : IRequest<ErrorOr<FechaImportanteDto>>;

public class UpdateFechaImportanteCommandHandler(IAppDbContext context)
    : IRequestHandler<UpdateFechaImportanteCommand, ErrorOr<FechaImportanteDto>>
{
    public async Task<ErrorOr<FechaImportanteDto>> Handle(UpdateFechaImportanteCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var fecha = await context.FechasImportantes
            .FirstOrDefaultAsync(f => f.Id == command.Id && f.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (fecha is null)
            return Error.NotFound("FECHA_NOT_FOUND", "La fecha importante no existe o no pertenece al congreso especificado.");

        fecha.Descripcion = command.Dto.Descripcion;
        fecha.Fecha = command.Dto.Fecha;
        fecha.FechaFin = command.Dto.FechaFin;

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
