using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Files.Commands;

public record UploadImageCommand(
    Guid UsuarioId,
    string Base64,
    string? ContentType = "image/jpeg"
) : IRequest<ErrorOr<UploadImageResult>>;

public record UploadImageResult(string Url, Guid Id);
