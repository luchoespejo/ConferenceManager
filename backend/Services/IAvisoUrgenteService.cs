using ConferenceManager.DTOs.AvisosUrgentes;

namespace ConferenceManager.Services;

public interface IAvisoUrgenteService
{
    Task<ServiceResult<List<AvisoUrgenteDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<AvisoUrgenteDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateAvisoUrgenteDto dto);
    Task<ServiceResult<AvisoUrgenteDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateAvisoUrgenteDto dto);
    Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
}
