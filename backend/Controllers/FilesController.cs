using ConferenceManager.Data;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConferenceManager.Controllers;

[ApiController]
public class FilesController(AppDbContext context) : ControllerBase
{
    private static readonly HashSet<string> AllowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"];
    private const int MaxBytes = 512 * 1024; // 500 KB decoded

    [HttpPost("api/dashboard/upload")]
    [Authorize]
    public async Task<IActionResult> Upload([FromBody] UploadRequest req)
    {
        var usuarioId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (string.IsNullOrWhiteSpace(req.Base64))
            return BadRequest(new { error = "MISSING_DATA" });

        // Strip data URI prefix if present: "data:image/png;base64,..."
        var base64 = req.Base64;
        string contentType = req.ContentType ?? "image/jpeg";

        if (base64.StartsWith("data:"))
        {
            var comma = base64.IndexOf(',');
            if (comma < 0) return BadRequest(new { error = "INVALID_FORMAT" });

            var meta = base64[5..comma]; // "image/png;base64"
            var semicolon = meta.IndexOf(';');
            if (semicolon > 0) contentType = meta[..semicolon];

            base64 = base64[(comma + 1)..];
        }

        if (!AllowedTypes.Contains(contentType))
            return BadRequest(new { error = "INVALID_TYPE", message = "Tipo de imagen no permitido. Usar JPG, PNG, WebP, GIF o ICO." });

        byte[] bytes;
        try { bytes = Convert.FromBase64String(base64); }
        catch { return BadRequest(new { error = "INVALID_BASE64" }); }

        if (bytes.Length > MaxBytes)
            return BadRequest(new { error = "FILE_TOO_LARGE", message = $"La imagen supera el límite de 500 KB. Tamaño recibido: {bytes.Length / 1024} KB." });

        var imagen = new ImagenAlmacenada
        {
            UsuarioId = usuarioId,
            ContentType = contentType,
            Datos = bytes
        };

        context.ImagenesAlmacenadas.Add(imagen);
        await context.SaveChangesAsync();

        var url = $"/api/files/{imagen.Id}";
        return Ok(new { url, id = imagen.Id });
    }

    [HttpGet("api/files/{id:guid}")]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetFile(Guid id)
    {
        var imagen = await context.ImagenesAlmacenadas
            .AsNoTracking()
            .Select(i => new { i.Id, i.ContentType, i.Datos })
            .FirstOrDefaultAsync(i => i.Id == id);

        if (imagen is null) return NotFound();

        return File(imagen.Datos, imagen.ContentType);
    }
}

public record UploadRequest(string Base64, string? ContentType);
