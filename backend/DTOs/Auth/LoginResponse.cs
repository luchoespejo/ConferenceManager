namespace ConferenceManager.DTOs.Auth;

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);
