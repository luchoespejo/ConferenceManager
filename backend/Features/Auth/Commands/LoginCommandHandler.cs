using ConferenceManager.DTOs.Auth;
using ConferenceManager.Services;

namespace ConferenceManager.Features.Auth.Commands;

public class LoginCommandHandler(IAuthService authService) : ILoginCommandHandler
{
    public async Task<ServiceResult<LoginResponse>> ExecuteAsync(LoginCommand command)
    {
        var request = new LoginRequest(command.Email, command.Password);
        return await authService.LoginAsync(request);
    }
}
