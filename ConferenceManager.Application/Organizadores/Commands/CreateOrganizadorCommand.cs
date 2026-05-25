using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.DTOs.Organizadores;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Organizadores.Commands;

public record CreateOrganizadorCommand(Guid ConferenciaId, Guid UsuarioId, CreateOrganizadorDto Dto)
    : IRequest<ErrorOr<OrganizadorDto>>;

public class CreateOrganizadorCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateOrganizadorCommand, ErrorOr<OrganizadorDto>>
{
    public async Task<ErrorOr<OrganizadorDto>> Handle(CreateOrganizadorCommand command, CancellationToken cancellationToken)
    {
        var owns = await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == command.ConferenciaId && c.UsuarioId == command.UsuarioId, cancellationToken);

        if (!owns)
            return Error.NotFound("CONFERENCIA_NOT_FOUND", "El congreso no existe o no pertenece al usuario autenticado.");

        var organizador = new Organizador
        {
            ConferenciaId = command.ConferenciaId,
            Nombre = command.Dto.Nombre,
            LogoUrl = command.Dto.LogoUrl,
            Orden = command.Dto.Orden
        };

        context.Organizadores.Add(organizador);
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
