using ConferenceManager.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController(AppDbContext context, IConfiguration config) : ControllerBase
{
    private bool IsAuthorized()
    {
        var secretKey = config["Admin:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey)) return false;
        Request.Headers.TryGetValue("X-Admin-Key", out var provided);
        return provided == secretKey;
    }

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var usuarios = await context.Usuarios
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Nombre,
                u.Organizacion,
                u.EmailVerificado,
                u.Activo,
                u.CreatedAt,
                CongresoCount = context.Conferencias.Count(c => c.UsuarioId == u.Id)
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPut("usuarios/{id:guid}/activar")]
    public async Task<IActionResult> Activar(Guid id)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var usuario = await context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound(new { error = "NOT_FOUND" });

        usuario.Activo = true;
        await context.SaveChangesAsync();
        return Ok(new { message = "Usuario activado." });
    }

    [HttpPut("usuarios/{id:guid}/desactivar")]
    public async Task<IActionResult> Desactivar(Guid id)
    {
        if (!IsAuthorized()) return Unauthorized(new { error = "UNAUTHORIZED" });

        var usuario = await context.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound(new { error = "NOT_FOUND" });

        usuario.Activo = false;
        await context.SaveChangesAsync();
        return Ok(new { message = "Usuario desactivado." });
    }
}
