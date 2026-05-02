using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias")]
public class ConferenciasController(IConferenciaService conferenciaService) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(JwtRegisteredClaimNames.Sub)!);

    [HttpGet]
    public async Task<IActionResult> GetMisConferencias()
    {
        var lista = await conferenciaService.GetMisConferenciasAsync(UsuarioId);
        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> CreateConferencia([FromBody] CreateConferenciaDto dto)
    {
        var result = await conferenciaService.CreateAsync(dto, UsuarioId);

        if (result.Success)
            return CreatedAtAction(
                nameof(GetConferencia),
                new { id = result.Data!.Id },
                result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.SlugAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ConferenciaErrorCodes.FechaInicioAfterFechaFin or
            ConferenciaErrorCodes.SlugInvalidFormat =>
                BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetConferencia(Guid id)
    {
        var detalle = await conferenciaService.GetByIdAsync(id, UsuarioId);

        if (detalle is null)
            return NotFound();

        return Ok(detalle);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateConferencia(Guid id, [FromBody] UpdateConferenciaDto dto)
    {
        var result = await conferenciaService.UpdateAsync(id, dto, UsuarioId);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.SlugAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ConferenciaErrorCodes.FechaInicioAfterFechaFin or
            ConferenciaErrorCodes.SlugInvalidFormat or
            ConferenciaErrorCodes.CannotChangeSlugNonDraft =>
                BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteConferencia(Guid id)
    {
        var result = await conferenciaService.DeleteAsync(id, UsuarioId);

        if (result.Success)
            return NoContent();

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.CannotDeleteNonDraft =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpPut("{id:guid}/publicar")]
    public async Task<IActionResult> PublicarConferencia(Guid id)
    {
        var result = await conferenciaService.PublicarAsync(id, UsuarioId);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.CannotPublishNotDraft =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }
}
