using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Auth.Commands;

public record VerifyEmailCommand(string Token) : IRequest<ErrorOr<Success>>;
