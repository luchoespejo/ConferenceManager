using ConferenceManager.DTOs.Sesiones;

namespace ConferenceManager.Services;

public interface ISesionService
{
    Task<ServiceResult<IEnumerable<SesionListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SesionDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<SesionDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateSesionDto dto);
    Task<ServiceResult<SesionDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateSesionDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<int>> RegenerarQrsAsync(Guid conferenciaId, Guid usuarioId);
}
