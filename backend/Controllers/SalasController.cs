using ConferenceManager.DTOs.Salas;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/salas")]
public class SalasController(ISalaService salaService) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetSalas(Guid conferenciaId)
    {
        var result = await salaService.GetSalasByConferenciaAsync(conferenciaId, UsuarioId);

        if (!result.Success)
            return result.ErrorCode switch
            {
                SalaErrorCodes.ConferenciaNotFound => NotFound(),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            };

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSala(Guid conferenciaId, [FromBody] CreateSalaDto dto)
    {
        var result = await salaService.CreateAsync(dto, conferenciaId, UsuarioId);

        if (result.Success)
            return CreatedAtAction(
                nameof(GetSala),
                new { conferenciaId, id = result.Data!.Id },
                result.Data);

        return result.ErrorCode switch
        {
            SalaErrorCodes.ConferenciaNotFound => NotFound(),
            SalaErrorCodes.NombreAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            SalaErrorCodes.CapacidadInvalid =>
                BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetSala(Guid conferenciaId, Guid id)
    {
        var sala = await salaService.GetByIdAsync(id, conferenciaId, UsuarioId);

        if (sala is null)
            return NotFound();

        return Ok(sala);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateSala(Guid conferenciaId, Guid id, [FromBody] UpdateSalaDto dto)
    {
        var result = await salaService.UpdateAsync(id, dto, conferenciaId, UsuarioId);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            SalaErrorCodes.ConferenciaNotFound or SalaErrorCodes.SalaNotFound => NotFound(),
            SalaErrorCodes.NombreAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteSala(Guid conferenciaId, Guid id)
    {
        var result = await salaService.DeleteAsync(id, conferenciaId, UsuarioId);

        if (result.Success)
            return NoContent();

        return result.ErrorCode switch
        {
            SalaErrorCodes.ConferenciaNotFound or SalaErrorCodes.SalaNotFound => NotFound(),
            SalaErrorCodes.CannotDeleteWithSesiones =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }
}
