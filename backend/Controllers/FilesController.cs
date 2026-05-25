using ConferenceManager.Application.Files.Commands;
using ConferenceManager.Application.Files.Queries;
using ConferenceManager.Extensions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
public class FilesController(IMediator mediator) : ControllerBase
{
    [HttpPost("api/dashboard/upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromBody] UploadRequest req)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await mediator.Send(new UploadImageCommand(usuarioId, req.Base64, req.ContentType));
        return result.ToActionResult();
    }

    [HttpGet("api/files/{id:guid}")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetFile(Guid id)
    {
        var result = await mediator.Send(new GetFileQuery(id));
        return result.Match<IActionResult>(
            file => File(file.Datos, file.ContentType),
            _ => NotFound());
    }
}

public record UploadRequest(string Base64, string? ContentType);
