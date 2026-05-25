using ConferenceManager.Application.Expositores.Commands;
using ConferenceManager.Application.Expositores.Queries;
using ConferenceManager.DTOs.Expositores;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/expositores")]
[Authorize]
public class ExpositoresController(IMediator mediator) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid conferenciaId)
    {
        var result = await mediator.Send(new GetExpositoresQuery(conferenciaId, UsuarioId));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new GetExpositorByIdQuery(id, conferenciaId, UsuarioId));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, CreateExpositorDto dto)
    {
        var result = await mediator.Send(new CreateExpositorCommand(conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(
            data => CreatedAtAction(nameof(GetById), new { conferenciaId, id = data.Id }, data),
            errors => StatusCode(400, new { error = errors[0].Code }));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid conferenciaId, Guid id, UpdateExpositorDto dto)
    {
        var result = await mediator.Send(new UpdateExpositorCommand(id, conferenciaId, UsuarioId, dto));
        return result.Match<IActionResult>(data => Ok(data), _ => NotFound());
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await mediator.Send(new DeleteExpositorCommand(id, conferenciaId, UsuarioId));
        return result.Match<IActionResult>(
            _ => NoContent(),
            errors => errors[0].Code == "CANNOT_DELETE_WITH_SESSIONS"
                ? StatusCode(422, new { error = errors[0].Code })
                : NotFound());
    }

    [HttpPost("send-credentials")]
    public async Task<IActionResult> SendCredentials(Guid conferenciaId, [FromBody] SendCredentialsRequest req)
    {
        var result = await mediator.Send(new SendCredentialsCommand(conferenciaId, UsuarioId, req.ExpositorIds));
        return result.Match<IActionResult>(
            data => Ok(new { message = data.Message }),
            errors => errors[0].Code switch
            {
                "CONFERENCIA_NOT_FOUND" => NotFound(new { error = errors[0].Code }),
                "NO_EXPOSITORES" => BadRequest(new { error = errors[0].Code }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }
}

public record SendCredentialsRequest(
    Guid[] ExpositorIds
);
