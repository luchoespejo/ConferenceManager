using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Auth;

public record RegistroRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(8)] string Password,
    [Required, MaxLength(200)] string Nombre,
    [MaxLength(200)] string? Organizacion
);
