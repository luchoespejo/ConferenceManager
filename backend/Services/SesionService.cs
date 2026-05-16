using ConferenceManager.Data;
using ConferenceManager.DTOs.Sesiones;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Services;

public class SesionService(AppDbContext context, IQrService qrService, IConfiguration config) : ISesionService
{
    private async Task<bool> VerifyOwnershipAsync(Guid conferenciaId, Guid usuarioId)
    {
        return await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);
    }

    private async Task<bool> SalaInConferenciaAsync(Guid salaId, Guid conferenciaId)
    {
        return await context.Salas
            .AsNoTracking()
            .AnyAsync(s => s.Id == salaId && s.ConferenciaId == conferenciaId);
    }

    private async Task<bool> ExpositorInConferenciaAsync(Guid expositorId, Guid conferenciaId)
    {
        return await context.Expositores
            .AsNoTracking()
            .AnyAsync(e => e.Id == expositorId && e.ConferenciaId == conferenciaId);
    }

    public async Task<ServiceResult<IEnumerable<SesionListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<IEnumerable<SesionListItemDto>>.Fail(SesionErrorCodes.ConferenciaNotFound);

        var sesiones = await context.Sesiones
            .AsNoTracking()
            .Where(s => s.ConferenciaId == conferenciaId)
            .Select(s => new SesionListItemDto
            {
                Id = s.Id,
                ConferenciaId = s.ConferenciaId,
                Titulo = s.Titulo,
                Fecha = s.Fecha,
                HoraInicio = s.HoraInicio,
                HoraFin = s.HoraFin,
                Track = s.Track,
                SalaNombre = s.Sala.Nombre,
                ExpositorNombre = s.Expositor.Nombre
            })
            .ToListAsync();

        return ServiceResult<IEnumerable<SesionListItemDto>>.Ok(sesiones.AsEnumerable());
    }

    public async Task<ServiceResult<SesionDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.ConferenciaNotFound);

        var sesion = await context.Sesiones
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId);

        if (sesion == null)
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.NotFound);

        return ServiceResult<SesionDto>.Ok(MapToDto(sesion));
    }

    public async Task<ServiceResult<SesionDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateSesionDto dto)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.ConferenciaNotFound);

        if (!await SalaInConferenciaAsync(dto.SalaId, conferenciaId))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.SalaNotInConferencia);

        if (!await ExpositorInConferenciaAsync(dto.ExpositorId, conferenciaId))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.ExpositorNotInConferencia);

        if (dto.HoraInicio >= dto.HoraFin)
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.InvalidTimeRange);

        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conferenciaId);

        if (conferencia != null && (dto.Fecha < conferencia.FechaInicio || dto.Fecha > conferencia.FechaFin))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.InvalidDateRange);

        var sesion = new Sesion
        {
            Id = Guid.NewGuid(),
            ConferenciaId = conferenciaId,
            SalaId = dto.SalaId,
            ExpositorId = dto.ExpositorId,
            Titulo = dto.Titulo,
            Descripcion = dto.Descripcion,
            Fecha = dto.Fecha,
            HoraInicio = dto.HoraInicio,
            HoraFin = dto.HoraFin,
            Track = dto.Track,
            EncuestaUrl = dto.EncuestaUrl
        };

        context.Sesiones.Add(sesion);
        await context.SaveChangesAsync();

        var siteUrl = config["App:SiteUrl"] ?? "http://localhost:3000";
        var qrUrl = await qrService.GenerateAsync($"{siteUrl}/s/{sesion.Id}");
        if (!string.IsNullOrEmpty(qrUrl))
        {
            sesion.QrCodeUrl = qrUrl;
            context.Sesiones.Update(sesion);
            await context.SaveChangesAsync();
        }

        return ServiceResult<SesionDto>.Ok(MapToDto(sesion));
    }

    public async Task<ServiceResult<SesionDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateSesionDto dto)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.ConferenciaNotFound);

        var sesion = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId);

        if (sesion == null)
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.NotFound);

        if (dto.SalaId.HasValue)
        {
            if (!await SalaInConferenciaAsync(dto.SalaId.Value, conferenciaId))
                return ServiceResult<SesionDto>.Fail(SesionErrorCodes.SalaNotInConferencia);
            sesion.SalaId = dto.SalaId.Value;
        }

        if (dto.ExpositorId.HasValue)
        {
            if (!await ExpositorInConferenciaAsync(dto.ExpositorId.Value, conferenciaId))
                return ServiceResult<SesionDto>.Fail(SesionErrorCodes.ExpositorNotInConferencia);
            sesion.ExpositorId = dto.ExpositorId.Value;
        }

        if (dto.Titulo != null) sesion.Titulo = dto.Titulo;
        if (dto.Descripcion != null) sesion.Descripcion = dto.Descripcion;
        if (dto.Fecha.HasValue) sesion.Fecha = dto.Fecha.Value;
        if (dto.HoraInicio.HasValue) sesion.HoraInicio = dto.HoraInicio.Value;
        if (dto.HoraFin.HasValue) sesion.HoraFin = dto.HoraFin.Value;
        if (dto.Track != null) sesion.Track = dto.Track;
        if (dto.EncuestaUrl != null) sesion.EncuestaUrl = dto.EncuestaUrl;

        if (sesion.HoraInicio >= sesion.HoraFin)
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.InvalidTimeRange);

        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conferenciaId);

        if (conferencia != null && (sesion.Fecha < conferencia.FechaInicio || sesion.Fecha > conferencia.FechaFin))
            return ServiceResult<SesionDto>.Fail(SesionErrorCodes.InvalidDateRange);

        await context.SaveChangesAsync();

        return ServiceResult<SesionDto>.Ok(MapToDto(sesion));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<bool>.Fail(SesionErrorCodes.ConferenciaNotFound);

        var sesion = await context.Sesiones
            .FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId);

        if (sesion == null)
            return ServiceResult<bool>.Fail(SesionErrorCodes.NotFound);

        context.Sesiones.Remove(sesion);
        await context.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    private static SesionDto MapToDto(Sesion s)
    {
        return new SesionDto
        {
            Id = s.Id,
            ConferenciaId = s.ConferenciaId,
            SalaId = s.SalaId,
            ExpositorId = s.ExpositorId,
            Titulo = s.Titulo,
            Descripcion = s.Descripcion,
            Fecha = s.Fecha,
            HoraInicio = s.HoraInicio,
            HoraFin = s.HoraFin,
            Track = s.Track,
            EncuestaUrl = s.EncuestaUrl,
            QrCodeUrl = s.QrCodeUrl,
            CreatedAt = s.CreatedAt
        };
    }

    public async Task<ServiceResult<int>> RegenerarQrsAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult<int>.Fail("ConferenciaNotFound", "El congreso no existe o no pertenece al usuario.");

        var sesiones = await context.Sesiones
            .Where(s => s.ConferenciaId == conferenciaId)
            .ToListAsync();

        var siteUrl = config["App:SiteUrl"] ?? "http://localhost:3000";
        var count = 0;

        foreach (var sesion in sesiones)
        {
            var qr = await qrService.GenerateAsync($"{siteUrl}/s/{sesion.Id}");
            if (qr is not null)
            {
                sesion.QrCodeUrl = qr;
                count++;
            }
        }

        await context.SaveChangesAsync();
        return ServiceResult<int>.Ok(count);
    }
}
