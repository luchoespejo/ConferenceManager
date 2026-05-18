using ConferenceManager.Data;
using ConferenceManager.DTOs.EjesTematicos;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/ejes-tematicos")]
public class EjesTematicoController(AppDbContext db) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetEjes(Guid conferenciaId)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var lista = await db.EjesTematicos
            .AsNoTracking()
            .Where(e => e.ConferenciaId == conferenciaId)
            .Select(e => new EjeTematicoDto { Id = e.Id, Nombre = e.Nombre })
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateEjeTematicoDto dto)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var eje = new EjeTematico
        {
            ConferenciaId = conferenciaId,
            Nombre = dto.Nombre
        };

        db.EjesTematicos.Add(eje);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEjes), new { conferenciaId },
            new EjeTematicoDto { Id = eje.Id, Nombre = eje.Nombre });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var eje = await db.EjesTematicos
            .FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId);

        if (eje is null) return NotFound();

        db.EjesTematicos.Remove(eje);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
