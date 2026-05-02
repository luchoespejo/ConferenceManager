namespace ConferenceManager.Models;

public class AvisoUrgente
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Mensaje { get; set; } = null!;
    public bool Activo { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public Conferencia Conferencia { get; set; } = null!;
}
