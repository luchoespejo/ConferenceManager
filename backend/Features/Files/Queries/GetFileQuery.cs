namespace ConferenceManager.Features.Files.Queries;

public record GetFileQuery(Guid Id);

public record FileResult(
    byte[] Datos,
    string ContentType
);

public interface IGetFileQueryHandler
{
    Task<FileResult?> ExecuteAsync(GetFileQuery query);
}
