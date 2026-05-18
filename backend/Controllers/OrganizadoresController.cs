using ConferenceManager.Data;
using ConferenceManager.DTOs.Organizadores;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias/{conferenciaId:guid}/organizadores")]
public class OrganizadoresController(AppDbContext db) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetOrganizadores(Guid conferenciaId)
    {
        var conferenciaExists = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!conferenciaExists)
            return NotFound();

        var lista = await db.Organizadores
            .AsNoTracking()
            .Where(o => o.ConferenciaId == conferenciaId)
            .OrderBy(o => o.Orden)
            .Select(o => new OrganizadorDto
            {
                Id = o.Id,
                Nombre = o.Nombre,
                LogoUrl = o.LogoUrl,
                Orden = o.Orden
            })
            .ToListAsync();

        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrganizador(Guid conferenciaId, [FromBody] CreateOrganizadorDto dto)
    {
        var conferenciaExists = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!conferenciaExists)
            return NotFound();

        var organizador = new Organizador
        {
            ConferenciaId = conferenciaId,
            Nombre = dto.Nombre,
            LogoUrl = dto.LogoUrl,
            Orden = dto.Orden
        };

        db.Organizadores.Add(organizador);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrganizadores), new { conferenciaId }, new OrganizadorDto
        {
            Id = organizador.Id,
            Nombre = organizador.Nombre,
            LogoUrl = organizador.LogoUrl,
            Orden = organizador.Orden
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateOrganizador(Guid conferenciaId, Guid id, [FromBody] UpdateOrganizadorDto dto)
    {
        var conferenciaExists = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!conferenciaExists)
            return NotFound();

        var organizador = await db.Organizadores
            .FirstOrDefaultAsync(o => o.Id == id && o.ConferenciaId == conferenciaId);

        if (organizador is null)
            return NotFound();

        organizador.Nombre = dto.Nombre;
        organizador.LogoUrl = dto.LogoUrl;
        organizador.Orden = dto.Orden;

        await db.SaveChangesAsync();

        return Ok(new OrganizadorDto
        {
            Id = organizador.Id,
            Nombre = organizador.Nombre,
            LogoUrl = organizador.LogoUrl,
            Orden = organizador.Orden
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteOrganizador(Guid conferenciaId, Guid id)
    {
        var conferenciaExists = await db.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == UsuarioId);

        if (!conferenciaExists)
            return NotFound();

        var organizador = await db.Organizadores
            .FirstOrDefaultAsync(o => o.Id == id && o.ConferenciaId == conferenciaId);

        if (organizador is null)
            return NotFound();

        db.Organizadores.Remove(organizador);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
