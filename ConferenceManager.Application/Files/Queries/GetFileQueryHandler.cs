using ConferenceManager.Application.Common.Interfaces;
using ErrorOr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Files.Queries;

public class GetFileQueryHandler(IAppDbContext context)
    : IRequestHandler<GetFileQuery, ErrorOr<FileResult>>
{
    public async Task<ErrorOr<FileResult>> Handle(GetFileQuery query, CancellationToken cancellationToken)
    {
        var imagen = await context.ImagenesAlmacenadas
            .AsNoTracking()
            .Where(i => i.Id == query.Id)
            .Select(i => new FileResult(i.Datos, i.ContentType))
            .FirstOrDefaultAsync(cancellationToken);

        return imagen is null
            ? Error.NotFound("Files.NotFound", "Archivo no encontrado.")
            : imagen;
    }
}
