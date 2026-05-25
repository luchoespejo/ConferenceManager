using ConferenceManager.Application.FechasImportantes.Commands;
using ConferenceManager.Application.FechasImportantes.Queries;
using ConferenceManager.DTOs.FechasImportantes;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/fechas-importantes")]
public class FechasImportantesController(IMediator mediator) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetFechas(Guid conferenciaId)
    {
        var result = await mediator.Send(new GetFechasImportantesQuery(conferenciaId, UsuarioId));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateFechaImportanteDto dto)
    {
        var result = await mediator.Send(new CreateFechaImportanteCommand(conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(
            data => CreatedAtAction(nameof(GetFechas), new { conferenciaId }, data),
            _ => NotFound());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid conferenciaId, Guid id, [FromBody] UpdateFechaImportanteDto dto)
    {
        var result = await mediator.Send(new UpdateFechaImportanteCommand(id, conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new DeleteFechaImportanteCommand(id, conferenciaId, UsuarioId));
        return result.Match<IActionResult>(_ => NoContent(), _ => NotFound());
    }
}
