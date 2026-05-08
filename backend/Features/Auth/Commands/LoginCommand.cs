using ConferenceManager.DTOs.Auth;
using ConferenceManager.Services;

namespace ConferenceManager.Features.Auth.Commands;

public record LoginCommand(string Email, string Password);

public interface ILoginCommandHandler
{
    Task<ServiceResult<LoginResponse>> ExecuteAsync(LoginCommand command);
}
