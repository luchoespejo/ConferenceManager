using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.EjesTematicos;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.EjesTematicos.Commands;

public record CreateEjeTematicoCommand(Guid ConferenciaId, Guid UsuarioId, string Nombre)
    : IRequest<ErrorOr<EjeTematicoDto>>;

public class CreateEjeTematicoCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateEjeTematicoCommand, ErrorOr<EjeTematicoDto>>
{
    public async Task<ErrorOr<EjeTematicoDto>> Handle(CreateEjeTematicoCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var eje = new EjeTematico
        {
            ConferenciaId = command.ConferenciaId,
            Nombre = command.Nombre
        };

        context.EjesTematicos.Add(eje);
        await context.SaveChangesAsync(cancellationToken);

        return new EjeTematicoDto { Id = eje.Id, Nombre = eje.Nombre };
    }
}
