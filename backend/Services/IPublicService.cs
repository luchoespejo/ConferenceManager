using ConferenceManager.DTOs.Public;

namespace ConferenceManager.Services;

public interface IPublicService
{
    Task<ConferenciaPublicaDto?> GetConferenciaBySlugAsync(string slug);
    Task<IEnumerable<SesionPublicaDto>> GetProgramaBySlugAsync(string slug);
    Task<IEnumerable<ExpositorPublicoDto>> GetExpositorsBySlugAsync(string slug);
    Task<SesionPublicaDto?> GetSesionByIdAsync(string slug, Guid id);
    Task<IEnumerable<AvisoUrgentePublicoDto>> GetAvisosActivosBySlugAsync(string slug);
}
