using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/expositores")]
[Authorize]
public class ExpositoresController(IExpositorService expositorService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpositorListItemDto>>> GetAll(Guid conferenciaId)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await expositorService.GetAllAsync(conferenciaId, usuarioId);

        if (!result.Success)
            return NotFound();

        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpositorDetalleDto>> GetById(Guid conferenciaId, Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await expositorService.GetByIdAsync(id, conferenciaId, usuarioId);

        if (!result.Success)
            return NotFound();

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<ActionResult<ExpositorDetalleDto>> Create(Guid conferenciaId, CreateExpositorDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await expositorService.CreateAsync(conferenciaId, usuarioId, dto);

        if (!result.Success)
            return StatusCode(400, new { error = result.ErrorCode });

        return CreatedAtAction(nameof(GetById), new { conferenciaId, id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExpositorDetalleDto>> Update(Guid conferenciaId, Guid id, UpdateExpositorDto dto)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await expositorService.UpdateAsync(id, conferenciaId, usuarioId, dto);

        if (!result.Success)
            return NotFound();

        return Ok(result.Data);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await expositorService.DeleteAsync(id, conferenciaId, usuarioId);

        if (!result.Success)
        {
            if (result.ErrorCode == ExpositorErrorCodes.CannotDeleteWithSessions)
                return StatusCode(422, new { error = result.ErrorCode });
            return NotFound();
        }

        return NoContent();
    }
}
