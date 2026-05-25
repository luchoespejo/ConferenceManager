using ConferenceManager.Application.EjesTematicos.Commands;
using ConferenceManager.Application.EjesTematicos.Queries;
using ConferenceManager.DTOs.EjesTematicos;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/ejes-tematicos")]
public class EjesTematicoController(IMediator mediator) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetEjes(Guid conferenciaId)
    {
        var result = await mediator.Send(new GetEjesTematicosQuery(conferenciaId, UsuarioId));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateEjeTematicoDto dto)
    {
        var result = await mediator.Send(new CreateEjeTematicoCommand(conferenciaId, UsuarioId, dto.Nombre));
        return result.Match<IActionResult>(
            data => CreatedAtAction(nameof(GetEjes), new { conferenciaId }, data),
            _ => NotFound());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new DeleteEjeTematicoCommand(id, conferenciaId, UsuarioId));
        return result.Match<IActionResult>(_ => NoContent(), _ => NotFound());
    }
}
