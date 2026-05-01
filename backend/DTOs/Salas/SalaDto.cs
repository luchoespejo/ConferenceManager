namespace ConferenceManager.DTOs.Salas;

public class SalaDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public int? Capacidad { get; set; }
    public DateTime CreadoEn { get; set; }
}
