using ErrorOr;
using MediatR;

namespace ConferenceManager.Application.Auth.Commands;

public record RegisterCommand(
    string Email,
    string Password,
    string Nombre,
    string? Organizacion
) : IRequest<ErrorOr<Success>>;
