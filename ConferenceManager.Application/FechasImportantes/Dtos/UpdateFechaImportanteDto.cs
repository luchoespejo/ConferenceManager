using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.FechasImportantes;

public class UpdateFechaImportanteDto
{
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    public DateOnly Fecha { get; set; }

    public DateOnly? FechaFin { get; set; }
}
