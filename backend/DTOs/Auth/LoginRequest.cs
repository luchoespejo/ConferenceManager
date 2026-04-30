using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);
