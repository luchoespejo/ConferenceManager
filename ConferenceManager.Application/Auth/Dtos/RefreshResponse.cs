namespace ConferenceManager.DTOs.Auth;

public record RefreshResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn
);
