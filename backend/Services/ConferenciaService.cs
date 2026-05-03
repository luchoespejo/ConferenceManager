using ConferenceManager.Data;
using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ConferenceManager.Services;

public class ConferenciaService(AppDbContext context) : IConferenciaService
{
    private static readonly Regex SlugRegex = new(@"^[a-z0-9-]{3,50}$", RegexOptions.Compiled);

    public async Task<IEnumerable<ConferenciaListItemDto>> GetMisConferenciasAsync(Guid usuarioId)
    {
        return await context.Conferencias
            .AsNoTracking()
            .Where(c => c.UsuarioId == usuarioId)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new ConferenciaListItemDto
            {
                Id = c.Id,
                Slug = c.Slug,
                Nombre = c.Nombre,
                Estado = c.Estado.ToString(),
                FechaInicio = c.FechaInicio,
                FechaFin = c.FechaFin,
                CantidadSesiones = context.Sesiones.Where(s => s.ConferenciaId == c.Id).Count(),
                CreadoEn = c.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ConferenciaDetalleDto?> GetByIdAsync(Guid id, Guid usuarioId)
    {
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return null;

        return MapToDetalleDto(conferencia);
    }

    public async Task<ServiceResult<ConferenciaDetalleDto>> CreateAsync(CreateConferenciaDto dto, Guid usuarioId)
    {
        // Validate slug format server-side
        if (dto.Slug is not null && !SlugRegex.IsMatch(dto.Slug))
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.SlugInvalidFormat,
                "El slug solo puede contener letras minúsculas, números y guiones, con longitud entre 3 y 50 caracteres.");

        // Validate date consistency
        if (dto.FechaInicio > dto.FechaFin)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.FechaInicioAfterFechaFin,
                "La fecha de inicio no puede ser posterior a la fecha de fin.");

        // Check slug uniqueness if provided
        if (dto.Slug is not null)
        {
            var slugExists = await context.Conferencias
                .AsNoTracking()
                .AnyAsync(c => c.Slug == dto.Slug);

            if (slugExists)
                return ServiceResult<ConferenciaDetalleDto>.Fail(
                    ConferenciaErrorCodes.SlugAlreadyExists,
                    "El slug ya está en uso.");
        }

        var conferencia = new Conferencia
        {
            UsuarioId = usuarioId,
            Nombre = dto.Nombre,
            Slug = dto.Slug ?? string.Empty,
            Descripcion = dto.Descripcion,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Estado = ConferenciaEstado.Borrador,
            ColorPrimario = dto.ColorPrimario,
            ColorSecundario = dto.ColorSecundario,
            Tipografia = dto.Tipografia,
            LogoUrl = dto.LogoUrl,
            LogoSecundarioUrl = dto.LogoSecundarioUrl,
            BannerUrl = dto.BannerUrl,
            FaviconUrl = dto.FaviconUrl,
            VenueNombre = dto.VenueNombre,
            VenueDireccion = dto.VenueDireccion,
            VenueLinkMaps = dto.VenueLinkMaps
        };

        context.Conferencias.Add(conferencia);
        await context.SaveChangesAsync();

        return ServiceResult<ConferenciaDetalleDto>.Ok(MapToDetalleDto(conferencia));
    }

    public async Task<ServiceResult<ConferenciaDetalleDto>> UpdateAsync(Guid id, UpdateConferenciaDto dto, Guid usuarioId)
    {
        // Verify ownership — tracking enabled so EF Core can detect changes
        var conferencia = await context.Conferencias
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        // Validate slug change only allowed in Borrador state
        if (dto.Slug is not null && dto.Slug != conferencia.Slug && conferencia.Estado != ConferenciaEstado.Borrador)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.CannotChangeSlugNonDraft,
                "El slug solo puede modificarse mientras el congreso esté en estado Borrador.");

        // Validate slug format if new slug provided
        if (dto.Slug is not null && !SlugRegex.IsMatch(dto.Slug))
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.SlugInvalidFormat,
                "El slug solo puede contener letras minúsculas, números y guiones, con longitud entre 3 y 50 caracteres.");

        // Check slug uniqueness excluding this record
        if (dto.Slug is not null && dto.Slug != conferencia.Slug)
        {
            var slugExists = await context.Conferencias
                .AsNoTracking()
                .AnyAsync(c => c.Slug == dto.Slug && c.Id != id);

            if (slugExists)
                return ServiceResult<ConferenciaDetalleDto>.Fail(
                    ConferenciaErrorCodes.SlugAlreadyExists,
                    "El slug ya está en uso.");
        }

        // Validate date consistency using effective values (merge DTO with existing)
        var efectivaInicio = dto.FechaInicio ?? conferencia.FechaInicio;
        var efectivaFin = dto.FechaFin ?? conferencia.FechaFin;
        if (efectivaInicio > efectivaFin)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.FechaInicioAfterFechaFin,
                "La fecha de inicio no puede ser posterior a la fecha de fin.");

        // Apply changes — only update non-null fields from DTO
        if (dto.Nombre is not null) conferencia.Nombre = dto.Nombre;
        if (dto.Slug is not null) conferencia.Slug = dto.Slug;
        if (dto.Descripcion is not null) conferencia.Descripcion = dto.Descripcion;
        if (dto.FechaInicio.HasValue) conferencia.FechaInicio = dto.FechaInicio.Value;
        if (dto.FechaFin.HasValue) conferencia.FechaFin = dto.FechaFin.Value;
        if (dto.ColorPrimario is not null) conferencia.ColorPrimario = dto.ColorPrimario;
        if (dto.ColorSecundario is not null) conferencia.ColorSecundario = dto.ColorSecundario;
        if (dto.Tipografia is not null) conferencia.Tipografia = dto.Tipografia;
        if (dto.LogoUrl is not null) conferencia.LogoUrl = dto.LogoUrl;
        if (dto.LogoSecundarioUrl is not null) conferencia.LogoSecundarioUrl = dto.LogoSecundarioUrl;
        if (dto.BannerUrl is not null) conferencia.BannerUrl = dto.BannerUrl;
        if (dto.FaviconUrl is not null) conferencia.FaviconUrl = dto.FaviconUrl;
        if (dto.VenueNombre is not null) conferencia.VenueNombre = dto.VenueNombre;
        if (dto.VenueDireccion is not null) conferencia.VenueDireccion = dto.VenueDireccion;
        if (dto.VenueLinkMaps is not null) conferencia.VenueLinkMaps = dto.VenueLinkMaps;

        await context.SaveChangesAsync();

        return ServiceResult<ConferenciaDetalleDto>.Ok(MapToDetalleDto(conferencia));
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, Guid usuarioId)
    {
        // Verify ownership — tracking enabled for Remove
        var conferencia = await context.Conferencias
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return ServiceResult.Fail(
                ConferenciaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        if (conferencia.Estado != ConferenciaEstado.Borrador)
            return ServiceResult.Fail(
                ConferenciaErrorCodes.CannotDeleteNonDraft,
                "Solo se pueden eliminar congresos en estado Borrador.");

        context.Conferencias.Remove(conferencia);
        await context.SaveChangesAsync();

        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<ConferenciaDetalleDto>> PublicarAsync(Guid id, Guid usuarioId)
    {
        var conferencia = await context.Conferencias
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        if (conferencia.Estado != ConferenciaEstado.Borrador)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.CannotPublishNotDraft,
                "Solo se pueden publicar congresos en estado Borrador.");

        conferencia.Estado = ConferenciaEstado.Publicado;
        await context.SaveChangesAsync();

        return ServiceResult<ConferenciaDetalleDto>.Ok(MapToDetalleDto(conferencia));
    }

    public async Task<ServiceResult<ConferenciaDetalleDto>> FinalizarAsync(Guid id, Guid usuarioId)
    {
        var conferencia = await context.Conferencias
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        if (conferencia.Estado != ConferenciaEstado.Publicado)
            return ServiceResult<ConferenciaDetalleDto>.Fail(
                ConferenciaErrorCodes.CannotFinalizeNotPublished,
                "Solo se pueden finalizar congresos en estado Publicado.");

        conferencia.Estado = ConferenciaEstado.Finalizado;
        await context.SaveChangesAsync();

        return ServiceResult<ConferenciaDetalleDto>.Ok(MapToDetalleDto(conferencia));
    }

    public async Task<ConferenciaOverviewDto?> GetOverviewAsync(Guid id, Guid usuarioId)
    {
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId);

        if (conferencia is null)
            return null;

        var totalSesiones = await context.Sesiones
            .AsNoTracking()
            .CountAsync(s => s.ConferenciaId == id);

        var totalExpositores = await context.Expositores
            .AsNoTracking()
            .CountAsync(e => e.ConferenciaId == id);

        var totalSalas = await context.Salas
            .AsNoTracking()
            .CountAsync(s => s.ConferenciaId == id);

        var totalParticipantes = await context.Participantes
            .AsNoTracking()
            .CountAsync(p => p.ConferenciaId == id);

        var proximasSesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.ConferenciaId == id)
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraInicio)
            .Take(3)
            .Select(s => new SesionProximaDto
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Fecha = s.Fecha,
                HoraInicio = s.HoraInicio,
                HoraFin = s.HoraFin,
                SalaNombre = s.Sala.Nombre,
                ExpositorNombre = s.Expositor.Nombre,
                Track = s.Track
            })
            .ToListAsync();

        return new ConferenciaOverviewDto
        {
            Id = conferencia.Id,
            Nombre = conferencia.Nombre,
            Slug = conferencia.Slug,
            Estado = conferencia.Estado.ToString(),
            FechaInicio = conferencia.FechaInicio,
            FechaFin = conferencia.FechaFin,
            ColorPrimario = conferencia.ColorPrimario,
            VenueNombre = conferencia.VenueNombre,
            VenueDireccion = conferencia.VenueDireccion,
            TotalSesiones = totalSesiones,
            TotalExpositores = totalExpositores,
            TotalSalas = totalSalas,
            TotalParticipantes = totalParticipantes,
            ProximasSesiones = proximasSesiones
        };
    }

    private static ConferenciaDetalleDto MapToDetalleDto(Conferencia c) => new()
    {
        Id = c.Id,
        Slug = c.Slug,
        Nombre = c.Nombre,
        Descripcion = c.Descripcion,
        FechaInicio = c.FechaInicio,
        FechaFin = c.FechaFin,
        Estado = c.Estado.ToString(),
        LogoUrl = c.LogoUrl,
        LogoSecundarioUrl = c.LogoSecundarioUrl,
        BannerUrl = c.BannerUrl,
        FaviconUrl = c.FaviconUrl,
        ColorPrimario = c.ColorPrimario,
        ColorSecundario = c.ColorSecundario,
        Tipografia = c.Tipografia,
        VenueNombre = c.VenueNombre,
        VenueDireccion = c.VenueDireccion,
        VenueLinkMaps = c.VenueLinkMaps,
        CreadoEn = c.CreatedAt
    };
}
