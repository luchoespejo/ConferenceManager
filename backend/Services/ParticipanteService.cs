using ConferenceManager.Data;
using ConferenceManager.DTOs.Participantes;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Services;

public class ParticipanteService(AppDbContext context) : IParticipanteService
{
    private static ParticipanteListItemDto ToDto(Participante p) => new()
    {
        Id = p.Id,
        Nombre = p.Nombre,
        Email = p.Email,
        Empresa = p.Empresa,
        PuedeGenerarCertificado = p.PuedeGenerarCertificado,
        CreatedAt = p.CreatedAt
    };

    private async Task<bool> ConferenciaPertenece(Guid conferenciaId, Guid usuarioId) =>
        await context.Conferencias.AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);

    public async Task<ServiceResult<List<ParticipanteListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<List<ParticipanteListItemDto>>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var lista = await context.Participantes
            .AsNoTracking()
            .Where(p => p.ConferenciaId == conferenciaId)
            .OrderBy(p => p.Nombre)
            .Select(p => ToDto(p))
            .ToListAsync();

        return ServiceResult<List<ParticipanteListItemDto>>.Ok(lista);
    }

    public async Task<ServiceResult<ParticipanteListItemDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var p = await context.Participantes.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && x.ConferenciaId == conferenciaId);

        if (p is null)
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Participante no encontrado.");

        return ServiceResult<ParticipanteListItemDto>.Ok(ToDto(p));
    }

    public async Task<ServiceResult<ParticipanteListItemDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateParticipanteDto dto)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var existe = await context.Participantes.AsNoTracking()
            .AnyAsync(p => p.ConferenciaId == conferenciaId && p.Email == dto.Email);

        if (existe)
            return ServiceResult<ParticipanteListItemDto>.Fail("EMAIL_ALREADY_EXISTS", "Ya existe un participante con ese email en este congreso.");

        var participante = new Participante
        {
            ConferenciaId = conferenciaId,
            Nombre = dto.Nombre,
            Email = dto.Email,
            Empresa = dto.Empresa,
            PuedeGenerarCertificado = dto.PuedeGenerarCertificado
        };

        context.Participantes.Add(participante);
        await context.SaveChangesAsync();

        return ServiceResult<ParticipanteListItemDto>.Ok(ToDto(participante));
    }

    public async Task<ServiceResult<ParticipanteListItemDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateParticipanteDto dto)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var participante = await context.Participantes
            .FirstOrDefaultAsync(p => p.Id == id && p.ConferenciaId == conferenciaId);

        if (participante is null)
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Participante no encontrado.");

        if (dto.Email is not null && dto.Email != participante.Email)
        {
            var existe = await context.Participantes.AsNoTracking()
                .AnyAsync(p => p.ConferenciaId == conferenciaId && p.Email == dto.Email && p.Id != id);

            if (existe)
                return ServiceResult<ParticipanteListItemDto>.Fail("EMAIL_ALREADY_EXISTS", "Ya existe un participante con ese email en este congreso.");
        }

        if (dto.Nombre is not null) participante.Nombre = dto.Nombre;
        if (dto.Email is not null) participante.Email = dto.Email;
        if (dto.Empresa is not null) participante.Empresa = dto.Empresa;
        if (dto.PuedeGenerarCertificado is not null) participante.PuedeGenerarCertificado = dto.PuedeGenerarCertificado.Value;

        await context.SaveChangesAsync();
        return ServiceResult<ParticipanteListItemDto>.Ok(ToDto(participante));
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult.Fail("NOT_FOUND", "Congreso no encontrado.");

        var participante = await context.Participantes
            .FirstOrDefaultAsync(p => p.Id == id && p.ConferenciaId == conferenciaId);

        if (participante is null)
            return ServiceResult.Fail("NOT_FOUND", "Participante no encontrado.");

        context.Participantes.Remove(participante);
        await context.SaveChangesAsync();
        return ServiceResult.Ok();
    }

    public async Task<ServiceResult<ParticipanteListItemDto>> ToggleCertificadoAsync(Guid id, Guid conferenciaId, Guid usuarioId, bool valor)
    {
        if (!await ConferenciaPertenece(conferenciaId, usuarioId))
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Congreso no encontrado.");

        var participante = await context.Participantes
            .FirstOrDefaultAsync(p => p.Id == id && p.ConferenciaId == conferenciaId);

        if (participante is null)
            return ServiceResult<ParticipanteListItemDto>.Fail("NOT_FOUND", "Participante no encontrado.");

        participante.PuedeGenerarCertificado = valor;
        await context.SaveChangesAsync();
        return ServiceResult<ParticipanteListItemDto>.Ok(ToDto(participante));
    }
}
