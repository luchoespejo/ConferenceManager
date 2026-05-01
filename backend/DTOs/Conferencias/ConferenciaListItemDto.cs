namespace ConferenceManager.DTOs.Conferencias;

public class ConferenciaListItemDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public int CantidadSesiones { get; set; }
    public DateTime CreadoEn { get; set; }
}
