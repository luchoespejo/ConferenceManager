using ConferenceManager.Features.Files.Commands;
using ConferenceManager.Features.Files.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
public class FilesController(
    IUploadImageCommandHandler uploadHandler,
    IGetFileQueryHandler getHandler
) : ControllerBase
{
    [HttpPost("api/dashboard/upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromBody] UploadRequest req)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var command = new UploadImageCommand(usuarioId, req.Base64, req.ContentType);
        var result = await uploadHandler.ExecuteAsync(command);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });

        return Ok(new { url = result.Data!.Url, id = result.Data.Id });
    }

    [HttpGet("api/files/{id:guid}")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetFile(Guid id)
    {
        var query = new GetFileQuery(id);
        var result = await getHandler.ExecuteAsync(query);

        if (result is null) return NotFound();

        return File(result.Datos, result.ContentType);
    }
}

public record UploadRequest(string Base64, string? ContentType);
