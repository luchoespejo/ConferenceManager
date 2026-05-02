using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.AvisosUrgentes;

public class UpdateAvisoUrgenteDto
{
    [MaxLength(500)]
    public string? Mensaje { get; set; }

    public bool? Activo { get; set; }
}
