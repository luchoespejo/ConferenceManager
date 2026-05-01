using ConferenceManager.DTOs.Salas;

namespace ConferenceManager.Services;

public interface ISalaService
{
    Task<ServiceResult<IEnumerable<SalaDto>>> GetSalasByConferenciaAsync(Guid conferenciaId, Guid usuarioId);
    Task<SalaDto?> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SalaDto>> CreateAsync(CreateSalaDto dto, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SalaDto>> UpdateAsync(Guid id, UpdateSalaDto dto, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
}
