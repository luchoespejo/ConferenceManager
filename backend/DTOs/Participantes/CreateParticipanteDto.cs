using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Participantes;

public class CreateParticipanteDto
{
    [Required, MaxLength(200)]
    public string Nombre { get; set; } = null!;

    [Required, MaxLength(254), EmailAddress]
    public string Email { get; set; } = null!;

    [MaxLength(200)]
    public string? Empresa { get; set; }

    public bool PuedeGenerarCertificado { get; set; } = false;
}
