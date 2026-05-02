using ConferenceManager.Data;
using ConferenceManager.DTOs.Public;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ConferenceManager.Services;

public class PublicService(AppDbContext context) : IPublicService
{
    public async Task<ConferenciaPublicaDto?> GetConferenciaBySlugAsync(string slug)
    {
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug && c.Estado == ConferenciaEstado.Publicado);

        if (conferencia is null)
            return null;

        return new ConferenciaPublicaDto
        {
            Id = conferencia.Id,
            Slug = conferencia.Slug,
            Nombre = conferencia.Nombre,
            Descripcion = conferencia.Descripcion,
            FechaInicio = conferencia.FechaInicio,
            FechaFin = conferencia.FechaFin,
            LogoUrl = conferencia.LogoUrl,
            LogoSecundarioUrl = conferencia.LogoSecundarioUrl,
            ColorPrimario = conferencia.ColorPrimario,
            ColorSecundario = conferencia.ColorSecundario,
            Tipografia = conferencia.Tipografia,
            VenueNombre = conferencia.VenueNombre,
            VenueDireccion = conferencia.VenueDireccion,
            VenueLinkMaps = conferencia.VenueLinkMaps
        };
    }

    public async Task<IEnumerable<SesionPublicaDto>> GetProgramaBySlugAsync(string slug)
    {
        var sesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.Conferencia.Slug == slug && s.Conferencia.Estado == ConferenciaEstado.Publicado)
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraInicio)
            .Select(s => new SesionPublicaDto
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Descripcion = s.Descripcion,
                Fecha = s.Fecha,
                HoraInicio = s.HoraInicio,
                HoraFin = s.HoraFin,
                Track = s.Track,
                SalaNombre = s.Sala.Nombre,
                ExpositorNombre = s.Expositor.Nombre,
                EncuestaUrl = s.EncuestaUrl,
                QrCodeUrl = s.QrCodeUrl
            })
            .ToListAsync();

        return sesiones;
    }

    public async Task<IEnumerable<ExpositorPublicoDto>> GetExpositorsBySlugAsync(string slug)
    {
        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.Conferencia.Slug == slug && e.Conferencia.Estado == ConferenciaEstado.Publicado)
            .Select(e => new ExpositorPublicoDto
            {
                Id = e.Id,
                Nombre = e.Nombre,
                Bio = e.Bio,
                FotoUrl = e.FotoUrl,
                RedesSociales = e.RedesSociales != null
                    ? JsonSerializer.Deserialize<Dictionary<string, string>>(e.RedesSociales.RootElement.GetRawText())
                    : null
            })
            .ToListAsync();

        return expositores;
    }
}
