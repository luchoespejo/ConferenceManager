namespace ConferenceManager.Services;

public interface IGithubPublishService
{
    Task<bool> PublishConferenceAsync(Guid conferenciaId, Guid usuarioId);
}
