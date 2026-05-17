using ConferenceManager.DTOs.Sesiones;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/sesiones")]
[Authorize]
public class SesionesController(ISesionService sesionService) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SesionListItemDto>>> GetAll(Guid conferenciaId)
    {
        var result = await sesionService.GetAllAsync(conferenciaId, UsuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SesionDto>> GetById(Guid conferenciaId, Guid id)
    {
        var result = await sesionService.GetByIdAsync(id, conferenciaId, UsuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpPost]
    public async Task<ActionResult<SesionDto>> Create(Guid conferenciaId, [FromBody] CreateSesionDto dto)
    {
        var result = await sesionService.CreateAsync(conferenciaId, UsuarioId, dto);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode });

        return CreatedAtAction(nameof(GetById), new { conferenciaId, id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SesionDto>> Update(Guid conferenciaId, Guid id, [FromBody] UpdateSesionDto dto)
    {
        var result = await sesionService.UpdateAsync(id, conferenciaId, UsuarioId, dto);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode });

        return Ok(result.Data);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var result = await sesionService.DeleteAsync(id, conferenciaId, UsuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return NoContent();
    }

    [HttpPost("regenerar-qrs")]
    public async Task<IActionResult> RegenerarQrs(Guid conferenciaId)
    {
        var result = await sesionService.RegenerarQrsAsync(conferenciaId, UsuarioId);

        if (!result.Success)
            return NotFound(new { error = result.ErrorCode });

        return Ok(result.Data);
    }
}
