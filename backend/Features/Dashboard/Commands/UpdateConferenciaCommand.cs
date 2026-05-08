using ConferenceManager.Services;

namespace ConferenceManager.Features.Dashboard.Commands;

public record UpdateConferenciaCommand(
    Guid ConferenciaId,
    string? Nombre,
    string? Descripcion,
    string? ColorPrimario,
    string? ColorSecundario,
    string? LogoUrl,
    string? BannerUrl,
    string? FaviconUrl
);

public interface IUpdateConferenciaCommandHandler
{
    Task<ServiceResult> ExecuteAsync(UpdateConferenciaCommand command);
}
