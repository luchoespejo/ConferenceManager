using ConferenceManager.Features.Dashboard.Commands;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[Route("api/dashboard")]
[ApiController]
[Authorize]
public class DashboardController(IUpdateConferenciaCommandHandler updateHandler) : ControllerBase
{
    [HttpPut("conferencias/{id:guid}")]
    public async Task<IActionResult> UpdateConferencia(Guid id, [FromBody] UpdateConferenciaRequest req)
    {
        var command = new UpdateConferenciaCommand(
            id,
            req.Nombre,
            req.Descripcion,
            req.ColorPrimario,
            req.ColorSecundario,
            req.LogoUrl,
            req.BannerUrl,
            req.FaviconUrl
        );

        var result = await updateHandler.ExecuteAsync(command);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });

        return Ok(new { message = "Conferencia actualizada" });
    }
}

public record UpdateConferenciaRequest(
    string? Nombre,
    string? Descripcion,
    string? ColorPrimario,
    string? ColorSecundario,
    string? LogoUrl,
    string? BannerUrl,
    string? FaviconUrl
);
