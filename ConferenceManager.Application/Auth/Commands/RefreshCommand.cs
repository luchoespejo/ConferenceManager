using ConferenceManager.DTOs.Auth;
using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Auth.Commands;

public record RefreshCommand(string RefreshToken) : IRequest<ErrorOr<LoginResponse>>;
