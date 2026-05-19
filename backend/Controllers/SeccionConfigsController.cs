using ConferenceManager.Data;
using ConferenceManager.DTOs.SeccionConfigs;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/secciones")]
public class SeccionConfigsController(AppDbContext db) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid conferenciaId)
    {
        var existe = await db.Conferencias.AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);
        if (!existe) return NotFound();

        var lista = await db.SeccionConfigs.AsNoTracking()
            .Where(s => s.ConferenciaId == conferenciaId)
            .Select(s => new SeccionConfigDto { SeccionKey = s.SeccionKey, BgColor = s.BgColor, TextoColor = s.TextoColor, FontSize = s.FontSize, LogoAltura = s.LogoAltura, LogoColumnas = s.LogoColumnas, PaddingV = s.PaddingV })
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> Upsert(Guid conferenciaId, string key, [FromBody] UpsertSeccionConfigDto dto)
    {
        var existe = await db.Conferencias.AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);
        if (!existe) return NotFound();

        var seccion = await db.SeccionConfigs
            .FirstOrDefaultAsync(s => s.ConferenciaId == conferenciaId && s.SeccionKey == key);

        if (seccion is null)
        {
            seccion = new SeccionConfig { ConferenciaId = conferenciaId, SeccionKey = key };
            db.SeccionConfigs.Add(seccion);
        }

        seccion.BgColor = string.IsNullOrEmpty(dto.BgColor) ? null : dto.BgColor;
        seccion.TextoColor = string.IsNullOrEmpty(dto.TextoColor) ? null : dto.TextoColor;
        seccion.FontSize = string.IsNullOrEmpty(dto.FontSize) ? null : dto.FontSize;
        seccion.LogoAltura = dto.LogoAltura;
        seccion.LogoColumnas = dto.LogoColumnas;
        seccion.PaddingV = dto.PaddingV;

        await db.SaveChangesAsync();

        return Ok(new SeccionConfigDto { SeccionKey = seccion.SeccionKey, BgColor = seccion.BgColor, TextoColor = seccion.TextoColor, FontSize = seccion.FontSize, LogoAltura = seccion.LogoAltura, LogoColumnas = seccion.LogoColumnas, PaddingV = seccion.PaddingV });
    }
}
