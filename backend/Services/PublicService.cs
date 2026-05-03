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

    public async Task<ExpositorPerfilDto?> GetExpositorPerfilByTokenAsync(string slug, string token)
    {
        var expositor = await context.Expositores
            .AsNoTracking()
            .Include(e => e.Conferencia)
            .FirstOrDefaultAsync(e => e.Conferencia.Slug == slug && e.TokenAcceso == token);

        if (expositor is null)
            return null;

        var sesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.ExpositorId == expositor.Id)
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

        return new ExpositorPerfilDto
        {
            Id = expositor.Id,
            Nombre = expositor.Nombre,
            Bio = expositor.Bio,
            FotoUrl = expositor.FotoUrl,
            Email = expositor.Email,
            ConferenciaNombre = expositor.Conferencia.Nombre,
            Sesiones = sesiones
        };
    }

    public async Task<IEnumerable<AvisoUrgentePublicoDto>> GetAvisosActivosBySlugAsync(string slug)
    {
        return await context.AvisosUrgentes
            .AsNoTracking()
            .Where(a => a.Conferencia.Slug == slug && a.Activo)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AvisoUrgentePublicoDto
            {
                Id = a.Id,
                Mensaje = a.Mensaje,
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<SesionPublicaDto?> GetSesionByIdAsync(string slug, Guid id)
    {
        var sesion = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.Id == id && s.Conferencia.Slug == slug && s.Conferencia.Estado == ConferenciaEstado.Publicado)
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
            .FirstOrDefaultAsync();

        return sesion;
    }
}
