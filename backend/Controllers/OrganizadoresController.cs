using ConferenceManager.Application.Organizadores.Commands;
using ConferenceManager.Application.Organizadores.Queries;
using ConferenceManager.DTOs.Organizadores;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/organizadores")]
public class OrganizadoresController(IMediator mediator) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetOrganizadores(Guid conferenciaId)
    {
        var result = await mediator.Send(new GetOrganizadoresQuery(conferenciaId, UsuarioId));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrganizador(Guid conferenciaId, [FromBody] CreateOrganizadorDto dto)
    {
        var result = await mediator.Send(new CreateOrganizadorCommand(conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(
            data => CreatedAtAction(nameof(GetOrganizadores), new { conferenciaId }, data),
            _ => NotFound());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateOrganizador(Guid conferenciaId, Guid id, [FromBody] UpdateOrganizadorDto dto)
    {
        var result = await mediator.Send(new UpdateOrganizadorCommand(id, conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrganizador(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new DeleteOrganizadorCommand(id, conferenciaId, UsuarioId));
        return result.Match<IActionResult>(_ => NoContent(), _ => NotFound());
    }
}
