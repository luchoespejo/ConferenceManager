namespace ConferenceManager.Services;

public interface IQrService
{
    Task<string?> GenerateAsync(string url);
}
