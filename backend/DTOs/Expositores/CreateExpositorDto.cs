using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Expositores;

public class CreateExpositorDto
{
    [Required, MaxLength(255)] public string Nombre { get; set; } = null!;
    public string? Bio { get; set; }
    public string? FotoUrl { get; set; }
    [EmailAddress, MaxLength(255)] public string? Email { get; set; }
    public Dictionary<string, string>? RedesSociales { get; set; }
}
