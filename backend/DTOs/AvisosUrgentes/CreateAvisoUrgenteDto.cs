using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.AvisosUrgentes;

public class CreateAvisoUrgenteDto
{
    [Required, MaxLength(500)]
    public string Mensaje { get; set; } = null!;

    public bool Activo { get; set; } = true;
}
