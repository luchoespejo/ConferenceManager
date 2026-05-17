namespace ConferenceManager.Services;

public record StaticSiteZip(byte[] Data, string Slug);

public interface IStaticSiteService
{
    Task<StaticSiteZip?> GenerateZipAsync(Guid conferenciaId, Guid usuarioId);
}
