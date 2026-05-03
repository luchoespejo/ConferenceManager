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

    [HttpGet("sesiones/{id}")]
    public async Task<ActionResult<SesionPublicaDto>> GetSesion(string slug, Guid id)
    {
        var sesion = await publicService.GetSesionByIdAsync(slug, id);

        if (sesion is null)
            return NotFound();

        return Ok(sesion);
    }

    [HttpGet("avisos")]
    public async Task<ActionResult<IEnumerable<AvisoUrgentePublicoDto>>> GetAvisos(string slug)
    {
        var avisos = await publicService.GetAvisosActivosBySlugAsync(slug);
        return Ok(avisos);
    }

    [HttpGet("mi-espacio")]
    public async Task<ActionResult<ExpositorPerfilDto>> GetMiEspacio(string slug, [FromQuery] string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { error = "TOKEN_REQUIRED" });

        var perfil = await publicService.GetExpositorPerfilByTokenAsync(slug, token);
        if (perfil is null)
            return NotFound(new { error = "TOKEN_INVALID" });

        return Ok(perfil);
    }
}
