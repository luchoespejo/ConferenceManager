using ConferenceManager.Services;

namespace ConferenceManager.Features.Files.Commands;

public record UploadImageCommand(
    Guid UsuarioId,
    string Base64,
    string? ContentType = "image/jpeg"
);

public record UploadImageResult(
    string Url,
    Guid Id
);

public interface IUploadImageCommandHandler
{
    Task<ServiceResult<UploadImageResult>> ExecuteAsync(UploadImageCommand command);
}
