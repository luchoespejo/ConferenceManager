namespace ConferenceManager.Models;

public class FechaImportante
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public DateOnly Fecha { get; set; }
    public DateOnly? FechaFin { get; set; }

    public Conferencia Conferencia { get; set; } = null!;
}
