using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
[Authorize]
[Route("api/dashboard/conferencias")]
public class ConferenciasController(
    IConferenciaService conferenciaService,
    IStaticSiteService staticSiteService,
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<ConferenciasController> logger) : ControllerBase
{
    private Guid UsuarioId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetMisConferencias()
    {
        var lista = await conferenciaService.GetMisConferenciasAsync(UsuarioId);
        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> CreateConferencia([FromBody] CreateConferenciaDto dto)
    {
        var result = await conferenciaService.CreateAsync(dto, UsuarioId);

        if (result.Success)
            return CreatedAtAction(
                nameof(GetConferencia),
                new { id = result.Data!.Id },
                result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.SlugAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ConferenciaErrorCodes.FechaInicioAfterFechaFin or
            ConferenciaErrorCodes.SlugInvalidFormat =>
                BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetConferencia(Guid id)
    {
        var detalle = await conferenciaService.GetByIdAsync(id, UsuarioId);

        if (detalle is null)
            return NotFound();

        return Ok(detalle);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateConferencia(Guid id, [FromBody] UpdateConferenciaDto dto)
    {
        var result = await conferenciaService.UpdateAsync(id, dto, UsuarioId);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.SlugAlreadyExists =>
                Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            ConferenciaErrorCodes.FechaInicioAfterFechaFin or
            ConferenciaErrorCodes.SlugInvalidFormat or
            ConferenciaErrorCodes.CannotChangeSlugNonDraft =>
                BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteConferencia(Guid id)
    {
        var result = await conferenciaService.DeleteAsync(id, UsuarioId);

        if (result.Success)
            return NoContent();

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.CannotDeleteNonDraft =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpGet("{id:guid}/overview")]
    public async Task<IActionResult> GetOverview(Guid id)
    {
        var overview = await conferenciaService.GetOverviewAsync(id, UsuarioId);

        if (overview is null)
            return NotFound();

        return Ok(overview);
    }

    [HttpPut("{id:guid}/publicar")]
    public async Task<IActionResult> PublicarConferencia(Guid id)
    {
        var result = await conferenciaService.PublicarAsync(id, UsuarioId);

        if (result.Success)
        {
            TriggerVercelDeploy();
            return Ok(result.Data);
        }

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.CannotPublishNotDraft =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpPost("{id:guid}/redeployar")]
    public async Task<IActionResult> RedeployarSitio(Guid id)
    {
        var conferencia = await conferenciaService.GetByIdAsync(id, UsuarioId);
        if (conferencia is null) return NotFound();

        var hookUrl = config["App:VercelDeployHookUrl"];
        if (string.IsNullOrEmpty(hookUrl))
            return BadRequest(new { error = "VERCEL_HOOK_NOT_CONFIGURED" });

        TriggerVercelDeploy();
        return Ok(new { triggered = true });
    }

    [HttpGet("{id:guid}/sitio-estatico")]
    public async Task<IActionResult> DescargarSitioEstatico(Guid id)
    {
        var result = await staticSiteService.GenerateZipAsync(id, UsuarioId);

        if (result is null)
            return NotFound(new { error = "CONFERENCIA_NOT_FOUND" });

        return File(result.Data, "application/zip", $"{result.Slug}-sitio.zip");
    }

    private void TriggerVercelDeploy()
    {
        var hookUrl = config["App:VercelDeployHookUrl"];
        if (string.IsNullOrEmpty(hookUrl)) return;

        _ = Task.Run(async () =>
        {
            try
            {
                var client = httpClientFactory.CreateClient();
                await client.PostAsync(hookUrl, null);
                logger.LogInformation("Vercel deploy hook triggered");
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Vercel deploy hook failed");
            }
        });
    }

    [HttpPut("{id:guid}/finalizar")]
    public async Task<IActionResult> FinalizarConferencia(Guid id)
    {
        var result = await conferenciaService.FinalizarAsync(id, UsuarioId);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            ConferenciaErrorCodes.ConferenciaNotFound => NotFound(),
            ConferenciaErrorCodes.CannotFinalizeNotPublished =>
                StatusCode(422, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }
}
