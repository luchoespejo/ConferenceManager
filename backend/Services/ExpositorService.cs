using ConferenceManager.Data;
using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace ConferenceManager.Services;

public class ExpositorService(AppDbContext context) : IExpositorService
{
    private async Task<bool> VerifyOwnershipAsync(Guid conferenciaId, Guid usuarioId)
    {
        return await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);
    }

    public async Task<ServiceResult<IEnumerable<ExpositorListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(ExpositorErrorCodes.ConferenciaNotFound);

        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.ConferenciaId == conferenciaId)
            .Select(e => new ExpositorListItemDto
            {
                Id = e.Id,
                ConferenciaId = e.ConferenciaId,
                Nombre = e.Nombre,
                Email = e.Email,
                FotoUrl = e.FotoUrl
            })
            .ToListAsync();

        return ServiceResult.Success(expositores.AsEnumerable());
    }

    public async Task<ServiceResult<ExpositorDetalleDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(ExpositorErrorCodes.ConferenciaNotFound);

        var expositor = await context.Expositores
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId);

        if (expositor == null)
            return ServiceResult.Fail(ExpositorErrorCodes.NotFound);

        return ServiceResult.Success(MapToDetalle(expositor));
    }

    public async Task<ServiceResult<ExpositorDetalleDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateExpositorDto dto)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(ExpositorErrorCodes.ConferenciaNotFound);

        var expositor = new Expositor
        {
            Id = Guid.NewGuid(),
            ConferenciaId = conferenciaId,
            Nombre = dto.Nombre,
            Bio = dto.Bio,
            FotoUrl = dto.FotoUrl,
            Email = dto.Email,
            RedesSociales = dto.RedesSociales != null ? JsonSerializer.SerializeToDocument(dto.RedesSociales) : null,
            TokenAcceso = Guid.NewGuid().ToString()
        };

        context.Expositores.Add(expositor);
        await context.SaveChangesAsync();

        return ServiceResult.Success(MapToDetalle(expositor));
    }

    public async Task<ServiceResult<ExpositorDetalleDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateExpositorDto dto)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(ExpositorErrorCodes.ConferenciaNotFound);

        var expositor = await context.Expositores
            .FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId);

        if (expositor == null)
            return ServiceResult.Fail(ExpositorErrorCodes.NotFound);

        if (dto.Nombre != null) expositor.Nombre = dto.Nombre;
        if (dto.Bio != null) expositor.Bio = dto.Bio;
        if (dto.FotoUrl != null) expositor.FotoUrl = dto.FotoUrl;
        if (dto.Email != null) expositor.Email = dto.Email;
        if (dto.RedesSociales != null) expositor.RedesSociales = JsonSerializer.SerializeToDocument(dto.RedesSociales);

        await context.SaveChangesAsync();

        return ServiceResult.Success(MapToDetalle(expositor));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await VerifyOwnershipAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(ExpositorErrorCodes.ConferenciaNotFound);

        var expositor = await context.Expositores
            .FirstOrDefaultAsync(e => e.Id == id && e.ConferenciaId == conferenciaId);

        if (expositor == null)
            return ServiceResult.Fail(ExpositorErrorCodes.NotFound);

        var tieneSesiones = await context.Sesiones.AnyAsync(s => s.ExpositorId == id);
        if (tieneSesiones)
            return ServiceResult.Fail(ExpositorErrorCodes.CannotDeleteWithSessions);

        context.Expositores.Remove(expositor);
        await context.SaveChangesAsync();

        return ServiceResult.Success(true);
    }

    private static ExpositorDetalleDto MapToDetalle(Expositor e)
    {
        var redesSociales = e.RedesSociales != null
            ? JsonSerializer.Deserialize<Dictionary<string, string>>(e.RedesSociales.RootElement.GetRawText())
            : null;

        return new ExpositorDetalleDto
        {
            Id = e.Id,
            ConferenciaId = e.ConferenciaId,
            Nombre = e.Nombre,
            Bio = e.Bio,
            FotoUrl = e.FotoUrl,
            Email = e.Email,
            RedesSociales = redesSociales,
            TokenAcceso = e.TokenAcceso
        };
    }
}
