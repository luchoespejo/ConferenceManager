using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Participantes;

public class UpdateParticipanteDto
{
    [MaxLength(200)]
    public string? Nombre { get; set; }

    [MaxLength(254), EmailAddress]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? Empresa { get; set; }

    public bool? PuedeGenerarCertificado { get; set; }
}
