using ConferenceManager.Models;

namespace ConferenceManager.Services;

public interface IJwtService
{
    string GenerateAccessToken(Usuario usuario);
    string GenerateRefreshTokenRaw();
    string HashRefreshToken(string rawToken);
}
