using ConferenceManager.DTOs.AvisosUrgentes;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/avisos-urgentes")]
[Authorize]
public class AvisosUrgentesController(IAvisoUrgenteService avisoService) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid conferenciaId)
    {
        var result = await avisoService.GetAllAsync(conferenciaId, UsuarioId);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateAvisoUrgenteDto dto)
    {
        var result = await avisoService.CreateAsync(conferenciaId, UsuarioId, dto);
        if (!result.Success) return BadRequest(new { error = result.ErrorCode });
        return Ok(result.Data);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid conferenciaId, Guid id, [FromBody] UpdateAvisoUrgenteDto dto)
    {
        var result = await avisoService.UpdateAsync(id, conferenciaId, UsuarioId, dto);
        if (!result.Success)
            return result.ErrorCode == "NOT_FOUND" ? NotFound() : BadRequest(new { error = result.ErrorCode });
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await avisoService.DeleteAsync(id, conferenciaId, UsuarioId);
        if (!result.Success) return NotFound(new { error = result.ErrorCode });
        return NoContent();
    }
}
