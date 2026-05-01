using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Conferencias;

public class CreateConferenciaDto
{
    [Required, MaxLength(255)]
    public string Nombre { get; set; } = null!;

    [MaxLength(50), RegularExpression(@"^[a-z0-9-]{3,50}$",
        ErrorMessage = "El slug solo puede contener letras minúsculas, números y guiones, con longitud entre 3 y 50 caracteres.")]
    public string? Slug { get; set; }

    public string? Descripcion { get; set; }

    [Required]
    public DateOnly FechaInicio { get; set; }

    [Required]
    public DateOnly FechaFin { get; set; }

    [MaxLength(7)]
    public string? ColorPrimario { get; set; }

    [MaxLength(7)]
    public string? ColorSecundario { get; set; }

    [MaxLength(100)]
    public string? Tipografia { get; set; }

    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public string? VenueLinkMaps { get; set; }
}
