using ConferenceManager.Data;
using ConferenceManager.DTOs.Salas;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Services;

public class SalaService(AppDbContext context) : ISalaService
{
    private async Task<bool> OwnershipValidAsync(Guid conferenciaId, Guid usuarioId)
    {
        return await context.Conferencias
            .AsNoTracking()
            .AnyAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);
    }

    public async Task<ServiceResult<IEnumerable<SalaDto>>> GetSalasByConferenciaAsync(Guid conferenciaId, Guid usuarioId)
    {
        if (!await OwnershipValidAsync(conferenciaId, usuarioId))
            return ServiceResult<IEnumerable<SalaDto>>.Fail(
                SalaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        var salas = await context.Salas
            .AsNoTracking()
            .Where(s => s.ConferenciaId == conferenciaId)
            .OrderBy(s => s.Nombre)
            .Select(s => new SalaDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Capacidad = s.Capacidad,
                CreadoEn = s.CreatedAt
            })
            .ToListAsync();

        return ServiceResult<IEnumerable<SalaDto>>.Ok(salas);
    }

    public async Task<SalaDto?> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await OwnershipValidAsync(conferenciaId, usuarioId))
            return null;

        return await context.Salas
            .AsNoTracking()
            .Where(s => s.Id == id && s.ConferenciaId == conferenciaId)
            .Select(s => new SalaDto
            {
                Id = s.Id,
                Nombre = s.Nombre,
                Capacidad = s.Capacidad,
                CreadoEn = s.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ServiceResult<SalaDto>> CreateAsync(CreateSalaDto dto, Guid conferenciaId, Guid usuarioId)
    {
        if (!await OwnershipValidAsync(conferenciaId, usuarioId))
            return ServiceResult<SalaDto>.Fail(
                SalaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        var nombreExists = await context.Salas
            .AsNoTracking()
            .AnyAsync(s => s.ConferenciaId == conferenciaId && s.Nombre == dto.Nombre);

        if (nombreExists)
            return ServiceResult<SalaDto>.Fail(
                SalaErrorCodes.NombreAlreadyExists,
                "Ya existe una sala con ese nombre en este congreso.");

        var sala = new Sala
        {
            ConferenciaId = conferenciaId,
            Nombre = dto.Nombre,
            Capacidad = dto.Capacidad
        };

        context.Salas.Add(sala);
        await context.SaveChangesAsync();

        return ServiceResult<SalaDto>.Ok(new SalaDto
        {
            Id = sala.Id,
            Nombre = sala.Nombre,
            Capacidad = sala.Capacidad,
            CreadoEn = sala.CreatedAt
        });
    }

    public async Task<ServiceResult<SalaDto>> UpdateAsync(Guid id, UpdateSalaDto dto, Guid conferenciaId, Guid usuarioId)
    {
        if (!await OwnershipValidAsync(conferenciaId, usuarioId))
            return ServiceResult<SalaDto>.Fail(
                SalaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        var sala = await context.Salas
            .FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId);

        if (sala is null)
            return ServiceResult<SalaDto>.Fail(
                SalaErrorCodes.SalaNotFound,
                "La sala no existe o no pertenece al congreso especificado.");

        if (dto.Nombre is not null && dto.Nombre != sala.Nombre)
        {
            var nombreExists = await context.Salas
                .AsNoTracking()
                .AnyAsync(s => s.ConferenciaId == conferenciaId && s.Nombre == dto.Nombre && s.Id != id);

            if (nombreExists)
                return ServiceResult<SalaDto>.Fail(
                    SalaErrorCodes.NombreAlreadyExists,
                    "Ya existe una sala con ese nombre en este congreso.");

            sala.Nombre = dto.Nombre;
        }

        if (dto.Capacidad.HasValue)
            sala.Capacidad = dto.Capacidad.Value;

        await context.SaveChangesAsync();

        return ServiceResult<SalaDto>.Ok(new SalaDto
        {
            Id = sala.Id,
            Nombre = sala.Nombre,
            Capacidad = sala.Capacidad,
            CreadoEn = sala.CreatedAt
        });
    }

    public async Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId)
    {
        if (!await OwnershipValidAsync(conferenciaId, usuarioId))
            return ServiceResult.Fail(
                SalaErrorCodes.ConferenciaNotFound,
                "El congreso no existe o no pertenece al usuario autenticado.");

        var sala = await context.Salas
            .FirstOrDefaultAsync(s => s.Id == id && s.ConferenciaId == conferenciaId);

        if (sala is null)
            return ServiceResult.Fail(
                SalaErrorCodes.SalaNotFound,
                "La sala no existe o no pertenece al congreso especificado.");

        var tieneSesiones = await context.Sesiones.AnyAsync(s => s.SalaId == id);

        if (tieneSesiones)
            return ServiceResult.Fail(
                SalaErrorCodes.CannotDeleteWithSesiones,
                "No se puede eliminar una sala con sesiones asignadas.");

        context.Salas.Remove(sala);
        await context.SaveChangesAsync();

        return ServiceResult.Ok();
    }
}
