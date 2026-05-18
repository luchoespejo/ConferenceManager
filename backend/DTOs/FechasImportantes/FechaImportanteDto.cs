namespace ConferenceManager.DTOs.FechasImportantes;

public class FechaImportanteDto
{
    public Guid Id { get; set; }
    public string Descripcion { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public DateOnly? FechaFin { get; set; }
}
