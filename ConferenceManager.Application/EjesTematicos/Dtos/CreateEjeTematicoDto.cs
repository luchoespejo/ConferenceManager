using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.EjesTematicos;

public class CreateEjeTematicoDto
{
    [Required]
    public string Nombre { get; set; } = null!;
}
