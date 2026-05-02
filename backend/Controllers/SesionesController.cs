using ConferenceManager.DTOs.Sesiones;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/sesiones")]
[Authorize]
public class SesionesController(ISesionService sesionService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SesionListItemDto>>> GetAll(Guid conferenciaId)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        var result = await sesionService.GetAllAsync(conferenciaId, usuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SesionDto>> GetById(Guid conferenciaId, Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        var result = await sesionService.GetByIdAsync(id, conferenciaId, usuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<ActionResult<SesionDto>> Create(Guid conferenciaId, [FromBody] CreateSesionDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        var result = await sesionService.CreateAsync(conferenciaId, usuarioId, dto);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode });

        return CreatedAtAction(nameof(GetById), new { conferenciaId, id = result.Data.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SesionDto>> Update(Guid conferenciaId, Guid id, [FromBody] UpdateSesionDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        var result = await sesionService.UpdateAsync(id, conferenciaId, usuarioId, dto);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "");
        var result = await sesionService.DeleteAsync(id, conferenciaId, usuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return NoContent();
    }
}
