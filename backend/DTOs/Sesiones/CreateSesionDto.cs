namespace ConferenceManager.DTOs.Sesiones;

public class CreateSesionDto
{
    public Guid SalaId { get; set; }
    public Guid ExpositorId { get; set; }
    public string Titulo { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string? Track { get; set; }
    public string? EncuestaUrl { get; set; }
    public string? QrCodeUrl { get; set; }
}
