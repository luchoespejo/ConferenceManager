using ConferenceManager.DTOs.Auth;
using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<ErrorOr<LoginResponse>>;
