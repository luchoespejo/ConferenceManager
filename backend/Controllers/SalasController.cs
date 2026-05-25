using ConferenceManager.Application.Salas.Commands;
using ConferenceManager.Application.Salas.Queries;
using ConferenceManager.DTOs.Salas;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/salas")]
public class SalasController(IMediator mediator) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetSalas(Guid conferenciaId)
    {
        var result = await mediator.Send(new GetSalasQuery(conferenciaId, UsuarioId));

        return result.Match<IActionResult>(
            data => Ok(data),
            errors => errors[0].Code switch
            {
                "CONFERENCIA_NOT_FOUND" => NotFound(),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }

    [HttpPost]
    public async Task<IActionResult> CreateSala(Guid conferenciaId, [FromBody] CreateSalaDto dto)
    {
        var result = await mediator.Send(new CreateSalaCommand(dto, conferenciaId, UsuarioId));

        return result.Match<IActionResult>(
            data => CreatedAtAction(nameof(GetSala), new { conferenciaId, id = data.Id }, data),
            errors => errors[0].Code switch
            {
                "CONFERENCIA_NOT_FOUND" => NotFound(),
                "NOMBRE_ALREADY_EXISTS" => Conflict(new { error = errors[0].Code, message = errors[0].Description }),
                "CAPACIDAD_INVALID" => BadRequest(new { error = errors[0].Code, message = errors[0].Description }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSala(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new GetSalaByIdQuery(id, conferenciaId, UsuarioId));

        return result.Match<IActionResult>(
            data => Ok(data),
            _ => NotFound());
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSala(Guid conferenciaId, Guid id, [FromBody] UpdateSalaDto dto)
    {
        var result = await mediator.Send(new UpdateSalaCommand(id, dto, conferenciaId, UsuarioId));

        return result.Match<IActionResult>(
            data => Ok(data),
            errors => errors[0].Code switch
            {
                "CONFERENCIA_NOT_FOUND" or "SALA_NOT_FOUND" => NotFound(),
                "NOMBRE_ALREADY_EXISTS" => Conflict(new { error = errors[0].Code, message = errors[0].Description }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSala(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new DeleteSalaCommand(id, conferenciaId, UsuarioId));

        return result.Match<IActionResult>(
            _ => NoContent(),
            errors => errors[0].Code switch
            {
                "CONFERENCIA_NOT_FOUND" or "SALA_NOT_FOUND" => NotFound(),
                "CANNOT_DELETE_WITH_SESIONES" => StatusCode(422, new { error = errors[0].Code, message = errors[0].Description }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }
}
