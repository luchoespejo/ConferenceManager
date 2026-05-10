using ConferenceManager.Data;
using ConferenceManager.Features.Dashboard.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[Route("api/dashboard")]
[ApiController]
[Authorize]
public class DashboardController(IUpdateConferenciaCommandHandler updateHandler, AppDbContext context) : ControllerBase
{
    [HttpGet("preview/{id:guid}")]
    public async Task<IActionResult> GetPreview(Guid id)
    {
        var conf = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (conf is null)
            return NotFound(new { error = "NOT_FOUND", message = "Conferencia no encontrada" });

        var proximasSesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.ConferenciaId == id)
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraInicio)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.Titulo,
                Fecha = s.Fecha.ToString("dd/MM/yyyy"),
                HoraInicio = s.HoraInicio,
                HoraFin = s.HoraFin,
                SalaNombre = s.Sala!.Nombre,
                ExpositorNombre = s.Expositor!.Nombre,
                s.QrCodeUrl
            })
            .ToListAsync();

        var preview = new
        {
            conf.Id,
            conf.Nombre,
            conf.Slug,
            conf.Descripcion,
            conf.LogoUrl,
            conf.BannerUrl,
            conf.ColorPrimario,
            conf.ColorSecundario,
            ProximasSesiones = proximasSesiones
        };

        return Ok(preview);
    }
}

public record UpdateConferenciaRequest(
    string? Nombre,
    string? Descripcion,
    string? ColorPrimario,
    string? ColorSecundario,
    string? LogoUrl,
    string? BannerUrl,
    string? FaviconUrl
);
