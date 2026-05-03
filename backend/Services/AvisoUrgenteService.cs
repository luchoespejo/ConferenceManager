using ConferenceManager.Data;
using ConferenceManager.DTOs.AvisosUrgentes;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Services;

public class AvisoUrgenteService(AppDbContext context) : IAvisoUrgenteService
{
    private static AvisoUrgenteDto ToDto(AvisoUrgente a) => new()
    {
        Id = a.Id,
        Mensaje = a.Mensaje,
        Activo = a.Activo,
        CreatedAt = a.CreatedAt
    };

    private async Task<bool> ConferenciaPertenece(Guid conferenciaId, Guid usuarioId) =>
        await context.Conferencias.AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);

    public async Task<ServiceResult<List<AvisoUrgenteDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<List<AvisoUrgenteDto>>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var lista = await context.AvisosUrgentes
            .AsNoTracking()
            .Where(a => a.ConferenciaId == conferenciaId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => ToDto(a))
            .ToListAsync();

        return ServiceResult<List<AvisoUrgenteDto>>.Ok(lista);
    }

    public async Task<ServiceResult<AvisoUrgenteDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateAvisoUrgenteDto dto)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<AvisoUrgenteDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var aviso = new AvisoUrgente
        {
            ConferenciaId = conferenciaId,
            Mensaje = dto.Mensaje,
            Activo = dto.Activo
        };

        context.AvisosUrgentes.Add(aviso);
        await context.SaveChangesAsync();

        return ServiceResult<AvisoUrgenteDto>.Ok(ToDto(aviso));
    }

    public async Task<ServiceResult<AvisoUrgenteDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateAvisoUrgenteDto dto)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<AvisoUrgenteDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var aviso = await context.AvisosUrgentes
            .FirstOrDefaultAsync(a => a.Id == id && a.ConferenciaId == conferenciaId);

        if (aviso is null)
            return ServiceResult<AvisoUrgenteDto>.Fail("NOT_FOUND", "Aviso no encontrado.");

        if (!string.IsNullOrWhiteSpace(dto.Mensaje)) aviso.Mensaje = dto.Mensaje;
        if (dto.Activo is not null) aviso.Activo = dto.Activo.Value;

        await context.SaveChangesAsync();
        return ServiceResult<AvisoUrgenteDto>.Ok(ToDto(aviso));
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult.Fail("NOT_FOUND", "Congreso no encontrado.");

        var aviso = await context.AvisosUrgentes
            .FirstOrDefaultAsync(a => a.Id == id && a.ConferenciaId == conferenciaId);

        if (aviso is null)
            return ServiceResult.Fail("NOT_FOUND", "Aviso no encontrado.");

        context.AvisosUrgentes.Remove(aviso);
        await context.SaveChangesAsync();
        return ServiceResult.Ok();
    }
}
