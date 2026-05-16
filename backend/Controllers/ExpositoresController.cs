using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Services;
using ConferenceManager.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/dashboard/conferencias/{conferenciaId}/expositores")]
[Authorize]
public class ExpositoresController(IExpositorService expositorService, IEmailService emailService, AppDbContext context, IConfiguration config) : ControllerBase
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

    [HttpPost("send-credentials")]
    public async Task<IActionResult> SendCredentials(Guid conferenciaId, [FromBody] SendCredentialsRequest req)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Verificar propiedad de conferencia
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return NotFound(new { error = "CONFERENCIA_NOT_FOUND" });

        var organizadorEmail = await context.Usuarios
            .AsNoTracking()
            .Where(u => u.Id == usuarioId)
            .Select(u => u.Email)
            .FirstOrDefaultAsync();

        var expositorIds = req.ExpositorIds?.Any() == true
            ? req.ExpositorIds.ToList()
            : await context.Expositores
                .AsNoTracking()
                .Where(e => e.ConferenciaId == conferenciaId)
                .Select(e => e.Id)
                .ToListAsync();

        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.ConferenciaId == conferenciaId && expositorIds.Contains(e.Id))
            .ToListAsync();

        if (!expositores.Any())
            return BadRequest(new { error = "NO_EXPOSITORES" });

        var siteUrl = config["App:SiteUrl"] ?? "http://localhost:3000";
        var successCount = 0;

        foreach (var expositor in expositores)
        {
            if (string.IsNullOrEmpty(expositor.Email))
                continue;

            var accessUrl = $"{siteUrl}/expositor/{expositor.TokenAcceso}";
            var subject = $"Credenciales de acceso - {conferencia.Nombre}";
            var body = $@"
Hola {expositor.Nombre},

Te invitamos a acceder al panel de expositores de {conferencia.Nombre}.

Link de acceso: {accessUrl}

Este link es único para ti. No lo compartas.

¡Saludos!
";

            var emailResult = await emailService.SendAsync(expositor.Email, subject, body, replyTo: organizadorEmail, fromDisplayName: conferencia.Nombre);
            if (emailResult.Success)
                successCount++;
        }

        return Ok(new { message = $"Se enviaron {successCount} de {expositores.Count} emails" });
    }
}

public record SendCredentialsRequest(
    Guid[] ExpositorIds
);
