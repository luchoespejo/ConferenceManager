using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Salas;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Salas.Commands;

public record UpdateSalaCommand(Guid Id, UpdateSalaDto Dto, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<SalaDto>>;

public class UpdateSalaCommandHandler(IAppDbContext context)
    : IRequestHandler<UpdateSalaCommand, ErrorOr<SalaDto>>
{
    public async Task<ErrorOr<SalaDto>> Handle(UpdateSalaCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var sala = await context.Salas
            .FirstOrDefaultAsync(s => s.Id == command.Id && s.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (sala is null)
            return Error.NotFound("SALA_NOT_FOUND", "La sala no existe o no pertenece al congreso especificado.");

        if (command.Dto.Nombre is not null && command.Dto.Nombre != sala.Nombre)
        {
            var nombreExists = await context.Salas
                .AsNoTracking()
                .AnyAsync(s => s.ConferenciaId == command.ConferenciaId && s.Nombre == command.Dto.Nombre && s.Id != command.Id, cancellationToken);

            if (nombreExists)
                return Error.Conflict("NOMBRE_ALREADY_EXISTS", "Ya existe una sala con ese nombre en este congreso.");

            sala.Nombre = command.Dto.Nombre;
        }

        if (command.Dto.Capacidad.HasValue)
            sala.Capacidad = command.Dto.Capacidad.Value;

        await context.SaveChangesAsync(cancellationToken);

        return new SalaDto
        {
            Id = sala.Id,
            Nombre = sala.Nombre,
            Capacidad = sala.Capacidad,
            CreadoEn = sala.CreatedAt
        };
    }
}
