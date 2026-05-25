using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Organizadores;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Organizadores.Commands;

public record UpdateOrganizadorCommand(Guid Id, Guid ConferenciaId, Guid UsuarioId, UpdateOrganizadorDto Dto)
    : IRequest<ErrorOr<OrganizadorDto>>;

public class UpdateOrganizadorCommandHandler(IAppDbContext context)
    : IRequestHandler<UpdateOrganizadorCommand, ErrorOr<OrganizadorDto>>
{
    public async Task<ErrorOr<OrganizadorDto>> Handle(UpdateOrganizadorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var organizador = await context.Organizadores
            .FirstOrDefaultAsync(o => o.Id == command.Id && o.ConferenciaId == command.ConferenciaId, cancellationToken);

        if (organizador is null)
            return Error.NotFound("ORGANIZADOR_NOT_FOUND", "El organizador no existe o no pertenece al congreso especificado.");

        organizador.Nombre = command.Dto.Nombre;
        organizador.LogoUrl = command.Dto.LogoUrl;
        organizador.Orden = command.Dto.Orden;

        await context.SaveChangesAsync(cancellationToken);

        return new OrganizadorDto
        {
            Id = organizador.Id,
            Nombre = organizador.Nombre,
            LogoUrl = organizador.LogoUrl,
            Orden = organizador.Orden
        };
    }
}
