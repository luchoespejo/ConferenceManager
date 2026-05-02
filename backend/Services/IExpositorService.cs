using ConferenceManager.DTOs.Expositores;

namespace ConferenceManager.Services;

public interface IExpositorService
{
    Task<ServiceResult<IEnumerable<ExpositorListItemDto>>> GetAllAsync(Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<ExpositorDetalleDto>> GetByIdAsync(Guid id, Guid conferenciaId, Guid usuarioId);
    Task<ServiceResult<ExpositorDetalleDto>> CreateAsync(Guid conferenciaId, Guid usuarioId, CreateExpositorDto dto);
    Task<ServiceResult<ExpositorDetalleDto>> UpdateAsync(Guid id, Guid conferenciaId, Guid usuarioId, UpdateExpositorDto dto);
    Task<ServiceResult<bool>> DeleteAsync(Guid id, Guid conferenciaId, Guid usuarioId);
}
