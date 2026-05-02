using ConferenceManager.DTOs.Participantes;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/participantes")]
[Authorize]
public class ParticipantesController(IParticipanteService participanteService) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid conferenciaId)
    {
        var result = await participanteService.GetAllAsync(conferenciaId, UsuarioId);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid conferenciaId, Guid id)
    {
        var result = await participanteService.GetByIdAsync(id, conferenciaId, UsuarioId);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateParticipanteDto dto)
    {
        var result = await participanteService.CreateAsync(conferenciaId, UsuarioId, dto);
        if (!result.Success)
            return result.ErrorCode == "EMAIL_ALREADY_EXISTS"
                ? Conflict(new { error = result.ErrorCode, message = result.ErrorMessage })
                : BadRequest(new { error = result.ErrorCode });
        return CreatedAtAction(nameof(GetById), new { conferenciaId, id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid conferenciaId, Guid id, [FromBody] UpdateParticipanteDto dto)
    {
        var result = await participanteService.UpdateAsync(id, conferenciaId, UsuarioId, dto);
        if (!result.Success)
            return result.ErrorCode == "NOT_FOUND" ? NotFound() : Conflict(new { error = result.ErrorCode, message = result.ErrorMessage });
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await participanteService.DeleteAsync(id, conferenciaId, UsuarioId);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return NoContent();
    }

    [HttpPatch("{id:guid}/certificado")]
    public async Task<IActionResult> ToggleCertificado(Guid conferenciaId, Guid id, [FromBody] ToggleCertificadoDto dto)
    {
        var result = await participanteService.ToggleCertificadoAsync(id, conferenciaId, UsuarioId, dto.Valor);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return Ok(result.Data);
    }
}
