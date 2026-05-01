namespace ConferenceManager.Models;

public class Sala
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public int? Capacidad { get; set; }
    public DateTime CreatedAt { get; set; }

    public Conferencia Conferencia { get; set; } = null!;
}
