using ConferenceManager.Data;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Features.Files.Queries;

public class GetFileQueryHandler(AppDbContext context) : IGetFileQueryHandler
{
    public async Task<FileResult?> ExecuteAsync(GetFileQuery query)
    {
        var imagen = await context.ImagenesAlmacenadas
            .AsNoTracking()
            .Where(i => i.Id == query.Id)
            .Select(i => new FileResult(i.Datos, i.ContentType))
            .FirstOrDefaultAsync();

        return imagen;
    }
}
