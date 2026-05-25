using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Auth;

public record ReenviarVerificacionRequest(
    [Required, EmailAddress] string Email
);
