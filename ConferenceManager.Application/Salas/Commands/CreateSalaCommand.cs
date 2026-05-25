using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Salas;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Salas.Commands;

public record CreateSalaCommand(CreateSalaDto Dto, Guid ConferenciaId, Guid UsuarioId)
    : IRequest<ErrorOr<SalaDto>>;

public class CreateSalaCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateSalaCommand, ErrorOr<SalaDto>>
{
    public async Task<ErrorOr<SalaDto>> Handle(CreateSalaCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var nombreExists = await context.Salas
            .AsNoTracking()
            .AnyAsync(s => s.ConferenciaId == command.ConferenciaId && s.Nombre == command.Dto.Nombre, cancellationToken);

        if (nombreExists)
            return Error.Conflict("NOMBRE_ALREADY_EXISTS", "Ya existe una sala con ese nombre en este congreso.");

        var sala = new Sala
        {
            ConferenciaId = command.ConferenciaId,
            Nombre = command.Dto.Nombre,
            Capacidad = command.Dto.Capacidad
        };

        context.Salas.Add(sala);
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
