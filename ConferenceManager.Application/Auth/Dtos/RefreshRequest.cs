using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Auth;

public record RefreshRequest(
    [Required] string RefreshToken
);
