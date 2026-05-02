using ConferenceManager.DTOs.Participantes;

namespace ConferenceManager.Services;

public interface IParticipanteService
{
    Task<ServiceResult<List<ParticipanteListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<ParticipanteListItemDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<ParticipanteListItemDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateParticipanteDto dto);
    Task<ServiceResult<ParticipanteListItemDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateParticipanteDto dto);
    Task<ServiceResult> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<ParticipanteListItemDto>> ToggleCertificadoAsync(Guid id, Guid conferenciaId, Guid usuarioId, bool valor);
}
