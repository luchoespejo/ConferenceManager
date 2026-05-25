using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Models;
using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Files.Commands;

public class UploadImageCommandHandler(IAppDbContext context)
    : IRequestHandler<UploadImageCommand, ErrorOr<UploadImageResult>>
{
    private static readonly HashSet<string> AllowedTypes =
        ["image/jpeg", "image/png", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"];
    private const int MaxBytes = 512 * 1024;

    public async Task<ErrorOr<UploadImageResult>> Handle(UploadImageCommand command, CancellationToken cancellationToken)
    {
        var base64 = command.Base64;
        var contentType = command.ContentType ?? "image/jpeg";

        if (string.IsNullOrWhiteSpace(base64))
            return Error.Validation("MISSING_DATA", "Base64 data requerido.");

        // Strip data URI prefix
        if (base64.StartsWith("data:"))
        {
            var comma = base64.IndexOf(',');
            if (comma < 0)
                return Error.Validation("INVALID_FORMAT", "Formato de data URI inválido.");

            var meta = base64[5..comma];
            var semicolon = meta.IndexOf(';');
            if (semicolon > 0) contentType = meta[..semicolon];

            base64 = base64[(comma + 1)..];
        }

        if (!AllowedTypes.Contains(contentType))
            return Error.Validation("INVALID_TYPE", "Tipo de imagen no permitido. Usar JPG, PNG, WebP, GIF o ICO.");

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(base64);
        }
        catch
        {
            return Error.Validation("INVALID_BASE64", "Base64 inválido.");
        }

        if (bytes.Length > MaxBytes)
            return Error.Validation(
                "FILE_TOO_LARGE",
                $"La imagen supera el límite de 500 KB. Tamaño recibido: {bytes.Length / 1024} KB.");

        var imagen = new ImagenAlmacenada
        {
            UsuarioId = command.UsuarioId,
            ContentType = contentType,
            Datos = bytes
        };

        context.ImagenesAlmacenadas.Add(imagen);
        await context.SaveChangesAsync(cancellationToken);

        return new UploadImageResult($"/api/files/{imagen.Id}", imagen.Id);
    }
}
