using ConferenceManager.DTOs.Public;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/public/{slug}")]
public class PublicConferenciasController(IPublicService publicService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ConferenciaPublicaDto>> GetConferencia(string slug)
    {
        var conferencia = await publicService.GetConferenciaBySlugAsync(slug);

        if (conferencia is null)
            return NotFound();

        return Ok(conferencia);
    }

    [HttpGet("programa")]
    public async Task<ActionResult<IEnumerable<SesionPublicaDto>>> GetPrograma(string slug)
    {
        var sesiones = await publicService.GetProgramaBySlugAsync(slug);
        return Ok(sesiones);
    }

    [HttpGet("expositores")]
    public async Task<ActionResult<IEnumerable<ExpositorPublicoDto>>> GetExpositores(string slug)
    {
        var expositores = await publicService.GetExpositorsBySlugAsync(slug);
        return Ok(expositores);
    }
}
