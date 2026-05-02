namespace ConferenceManager.DTOs.Auth;

public record UsuarioInfo(Guid Id, string Email, string Nombre, string Organizacion);

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UsuarioInfo Usuario
);
