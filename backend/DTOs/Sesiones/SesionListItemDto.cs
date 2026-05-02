namespace ConferenceManager.DTOs.Sesiones;

public class SesionListItemDto
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Titulo { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string? Track { get; set; }
    public string SalaNombre { get; set; } = null!;
    public string ExpositorNombre { get; set; } = null!;
}
