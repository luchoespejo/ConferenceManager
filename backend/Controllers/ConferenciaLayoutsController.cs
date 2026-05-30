using ConferenceManager.Data;
using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/layouts")]
public class ConferenciaLayoutsController(
    AppDbContext db,
    IStaticSiteService staticSiteService,
    IServiceScopeFactory scopeFactory,
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<ConferenciaLayoutsController> logger) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // Verifica que el congreso pertenece al usuario
    private async Task<bool> ConferenciaExiste(Guid conferenciaId) =>
        await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

    // GET /api/dashboard/conferencias/{conferenciaId}/layouts
    [HttpGet]
    public async Task<IActionResult> GetLayouts(Guid conferenciaId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var layouts = await db.ConferenciaLayouts
            .AsNoTracking()
            .Where(l => l.ConferenciaId == conferenciaId)
            .OrderByDescending(l => l.IsActive)
            .ThenByDescending(l => l.UpdatedAt)
            .Select(l => new ConferenciaLayoutDto
            {
                Id = l.Id,
                ConferenciaId = l.ConferenciaId,
                Nombre = l.Nombre,
                LayoutJson = l.LayoutJson,
                IsActive = l.IsActive,
                CreatedAt = l.CreatedAt,
                UpdatedAt = l.UpdatedAt
            })
            .ToListAsync();

        return Ok(layouts);
    }

    // POST /api/dashboard/conferencias/{conferenciaId}/layouts
    [HttpPost]
    public async Task<IActionResult> CreateLayout(Guid conferenciaId, [FromBody] CreateLayoutTemplateRequest req)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        if (!IsValidLayoutJson(req.LayoutJson, out var err))
            return BadRequest(new { error = "INVALID_LAYOUT", message = err });

        var layout = new ConferenciaLayout
        {
            ConferenciaId = conferenciaId,
            Nombre = req.Nombre,
            LayoutJson = req.LayoutJson,
            IsActive = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.ConferenciaLayouts.Add(layout);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLayout), new { conferenciaId, layoutId = layout.Id }, MapDto(layout));
    }

    // GET /api/dashboard/conferencias/{conferenciaId}/layouts/{layoutId}
    [HttpGet("{layoutId:guid}")]
    public async Task<IActionResult> GetLayout(Guid conferenciaId, Guid layoutId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var layout = await db.ConferenciaLayouts
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == layoutId && l.ConferenciaId == conferenciaId);

        if (layout is null) return NotFound();

        return Ok(MapDto(layout));
    }

    // PUT /api/dashboard/conferencias/{conferenciaId}/layouts/{layoutId}
    [HttpPut("{layoutId:guid}")]
    public async Task<IActionResult> UpdateLayout(Guid conferenciaId, Guid layoutId, [FromBody] UpdateLayoutTemplateRequest req)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var layout = await db.ConferenciaLayouts
            .FirstOrDefaultAsync(l => l.Id == layoutId && l.ConferenciaId == conferenciaId);

        if (layout is null) return NotFound();

        if (req.LayoutJson is not null)
        {
            if (!IsValidLayoutJson(req.LayoutJson, out var err))
                return BadRequest(new { error = "INVALID_LAYOUT", message = err });
            layout.LayoutJson = req.LayoutJson;
        }

        if (req.Nombre is not null)
            layout.Nombre = req.Nombre;

        layout.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(MapDto(layout));
    }

    // DELETE /api/dashboard/conferencias/{conferenciaId}/layouts/{layoutId}
    [HttpDelete("{layoutId:guid}")]
    public async Task<IActionResult> DeleteLayout(Guid conferenciaId, Guid layoutId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var rows = await db.ConferenciaLayouts
            .Where(l => l.Id == layoutId && l.ConferenciaId == conferenciaId)
            .ExecuteDeleteAsync();

        if (rows == 0) return NotFound();

        return NoContent();
    }

    // PUT /api/dashboard/conferencias/{conferenciaId}/layouts/{layoutId}/activar
    [HttpPut("{layoutId:guid}/activar")]
    public async Task<IActionResult> SetActive(Guid conferenciaId, Guid layoutId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var target = await db.ConferenciaLayouts
            .FirstOrDefaultAsync(l => l.Id == layoutId && l.ConferenciaId == conferenciaId);

        if (target is null) return NotFound();

        // Desactivar todos los demás
        await db.ConferenciaLayouts
            .Where(l => l.ConferenciaId == conferenciaId && l.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(l => l.IsActive, false));

        target.IsActive = true;
        target.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(MapDto(target));
    }

    // POST /api/dashboard/conferencias/{conferenciaId}/layouts/{layoutId}/duplicar
    [HttpPost("{layoutId:guid}/duplicar")]
    public async Task<IActionResult> DuplicateLayout(Guid conferenciaId, Guid layoutId, [FromBody] DuplicateLayoutRequest req)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var source = await db.ConferenciaLayouts
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == layoutId && l.ConferenciaId == conferenciaId);

        if (source is null) return NotFound();

        var copy = new ConferenciaLayout
        {
            ConferenciaId = conferenciaId,
            Nombre = req.Nombre,
            LayoutJson = source.LayoutJson,
            IsActive = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.ConferenciaLayouts.Add(copy);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLayout), new { conferenciaId, layoutId = copy.Id }, MapDto(copy));
    }

    // GET /api/dashboard/conferencias/{conferenciaId}/layouts/descargar-zip[?layoutId=...]
    // Sin layoutId → usa conferencia.LayoutJson (último deploy).
    // Con layoutId → usa ese layout específico (útil para previsualizar copias sin activar).
    [HttpGet("descargar-zip")]
    public async Task<IActionResult> DescargarZip(Guid conferenciaId, [FromQuery] Guid? layoutId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var zip = await staticSiteService.GenerateZipAsync(conferenciaId, UsuarioId, layoutId);
        if (zip is null) return NotFound();

        return File(zip.Data, "application/zip", $"{zip.Slug}-sitio.zip");
    }

    // POST /api/dashboard/conferencias/{conferenciaId}/layouts/desplegar
    // Publica el layout activo al repo GitHub y dispara Vercel
    [HttpPost("desplegar")]
    public async Task<IActionResult> Desplegar(Guid conferenciaId)
    {
        if (!await ConferenciaExiste(conferenciaId)) return NotFound();

        var activeLayout = await db.ConferenciaLayouts
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.ConferenciaId == conferenciaId && l.IsActive);

        if (activeLayout is null)
            return BadRequest(new { error = "NO_ACTIVE_LAYOUT", message = "No hay una maqueta activa. Activá una antes de desplegar." });

        // Copiar el layoutJson del layout activo a Conferencia.LayoutJson para que la API pública lo sirva
        await db.Conferencias
            .Where(c => c.Id == conferenciaId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.LayoutJson, activeLayout.LayoutJson));

        // Disparar GitHub publish en background con scope propio
        // (el scope del request se dispone antes de que Task.Run ejecute)
        var capturedConferenciaId = conferenciaId;
        var capturedUsuarioId = UsuarioId;
        logger.LogInformation("[Deploy] Starting background GitHub publish for conferenciaId={Id}", capturedConferenciaId);
        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var svc = scope.ServiceProvider.GetRequiredService<IGithubPublishService>();
                var ok = await svc.PublishConferenceAsync(capturedConferenciaId, capturedUsuarioId);
                logger.LogInformation("[Deploy] Background GitHub publish finished — success={Ok}", ok);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[Deploy] Background GitHub publish threw unhandled exception");
            }
        });

        // Disparar Vercel deploy hook
        TriggerVercelDeploy();

        return Ok(new { triggered = true, layoutId = activeLayout.Id, layoutNombre = activeLayout.Nombre });
    }

    private void TriggerVercelDeploy()
    {
        var hookUrl = config["App:VercelDeployHookUrl"];
        if (string.IsNullOrEmpty(hookUrl)) return;

        _ = Task.Run(async () =>
        {
            try
            {
                var client = httpClientFactory.CreateClient();
                await client.PostAsync(hookUrl, null);
                logger.LogInformation("Vercel deploy hook triggered from layouts controller");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Vercel deploy hook failed");
            }
        });
    }

    private static ConferenciaLayoutDto MapDto(ConferenciaLayout l) => new()
    {
        Id = l.Id,
        ConferenciaId = l.ConferenciaId,
        Nombre = l.Nombre,
        LayoutJson = l.LayoutJson,
        IsActive = l.IsActive,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };

    private static bool IsValidLayoutJson(string json, out string error)
    {
        try
        {
            var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("version", out _))
            {
                error = "El layout debe incluir el campo 'version'.";
                return false;
            }
            error = string.Empty;
            return true;
        }
        catch (JsonException)
        {
            error = "El layout no es JSON válido.";
            return false;
        }
    }
}
