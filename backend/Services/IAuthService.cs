using ConferenceManager.DTOs.Auth;

namespace ConferenceManager.Services;

public interface IAuthService
{
    Task<ServiceResult> RegistrarAsync(RegistroRequest dto);
    Task<ServiceResult<LoginResponse>> LoginAsync(LoginRequest dto);
    Task<ServiceResult<LoginResponse>> RefreshAsync(string refreshTokenRaw);
    Task<ServiceResult> VerificarEmailAsync(string token);
    Task<ServiceResult> ReenviarVerificacionAsync(string email);
}
