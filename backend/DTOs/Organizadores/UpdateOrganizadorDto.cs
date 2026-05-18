using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Organizadores;

public class UpdateOrganizadorDto
{
    [Required]
    public string Nombre { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public int Orden { get; set; }
}
