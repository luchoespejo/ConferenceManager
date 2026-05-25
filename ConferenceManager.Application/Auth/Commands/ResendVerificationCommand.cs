using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Auth.Commands;

public record ResendVerificationCommand(string Email) : IRequest<ErrorOr<Success>>;
