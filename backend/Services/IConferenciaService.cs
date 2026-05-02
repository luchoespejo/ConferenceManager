using ConferenceManager.DTOs.Conferencias;

namespace ConferenceManager.Services;

public interface IConferenciaService
{
    Task<IEnumerable<ConferenciaListItemDto>> GetMisConferenciasAsync(Guid usuarioId);
    Task<ConferenciaDetalleDto?> GetByIdAsync(Guid id, Guid usuarioId);
    Task<ServiceResult<ConferenciaDetalleDto>> CreateAsync(CreateConferenciaDto dto, Guid usuarioId);
    Task<ServiceResult<ConferenciaDetalleDto>> UpdateAsync(Guid id, UpdateConferenciaDto dto, Guid usuarioId);
    Task<ServiceResult> DeleteAsync(Guid id, Guid usuarioId);
    Task<ServiceResult<ConferenciaDetalleDto>> PublicarAsync(Guid id, Guid usuarioId);
    Task<ServiceResult<ConferenciaDetalleDto>> FinalizarAsync(Guid id, Guid usuarioId);
    Task<ConferenciaOverviewDto?> GetOverviewAsync(Guid id, Guid usuarioId);
}
