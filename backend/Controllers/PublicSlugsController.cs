using ConferenceManager.Data;
using ConferenceManager.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/public")]
public class PublicSlugsController(AppDbContext context) : ControllerBase
{
    [HttpGet("slugs")]
    public async Task<ActionResult<IEnumerable<string>>> GetSlugs()
    {
        var slugs = await context.Conferencias
            .AsNoTracking()
            .Where(c => c.Estado == ConferenciaEstado.Publicado)
            .Select(c => c.Slug)
            .ToListAsync();

        return Ok(slugs);
    }
}
