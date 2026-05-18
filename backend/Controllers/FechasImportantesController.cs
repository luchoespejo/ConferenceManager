using ConferenceManager.Data;
using ConferenceManager.DTOs.FechasImportantes;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/fechas-importantes")]
public class FechasImportantesController(AppDbContext db) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetFechas(Guid conferenciaId)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var lista = await db.FechasImportantes
            .AsNoTracking()
            .Where(f => f.ConferenciaId == conferenciaId)
            .OrderBy(f => f.Fecha)
            .Select(f => new FechaImportanteDto
            {
                Id = f.Id,
                Descripcion = f.Descripcion,
                Fecha = f.Fecha,
                FechaFin = f.FechaFin
            })
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid conferenciaId, [FromBody] CreateFechaImportanteDto dto)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var fecha = new FechaImportante
        {
            ConferenciaId = conferenciaId,
            Descripcion = dto.Descripcion,
            Fecha = dto.Fecha,
            FechaFin = dto.FechaFin
        };

        db.FechasImportantes.Add(fecha);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFechas), new { conferenciaId }, new FechaImportanteDto
        {
            Id = fecha.Id,
            Descripcion = fecha.Descripcion,
            Fecha = fecha.Fecha,
            FechaFin = fecha.FechaFin
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid conferenciaId, Guid id, [FromBody] UpdateFechaImportanteDto dto)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var fecha = await db.FechasImportantes
            .FirstOrDefaultAsync(f => f.Id == id && f.ConferenciaId == conferenciaId);

        if (fecha is null) return NotFound();

        fecha.Descripcion = dto.Descripcion;
        fecha.Fecha = dto.Fecha;
        fecha.FechaFin = dto.FechaFin;

        await db.SaveChangesAsync();

        return Ok(new FechaImportanteDto
        {
            Id = fecha.Id,
            Descripcion = fecha.Descripcion,
            Fecha = fecha.Fecha,
            FechaFin = fecha.FechaFin
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid conferenciaId, Guid id)
    {
        var existe = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!existe) return NotFound();

        var fecha = await db.FechasImportantes
            .FirstOrDefaultAsync(f => f.Id == id && f.ConferenciaId == conferenciaId);

        if (fecha is null) return NotFound();

        db.FechasImportantes.Remove(fecha);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
