using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Files.Queries;

public record GetFileQuery(Guid Id) : IRequest<ErrorOr<FileResult>>;

public record FileResult(byte[] Datos, string ContentType);
