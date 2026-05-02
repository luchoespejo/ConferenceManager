namespace ConferenceManager.DTOs.AvisosUrgentes;

public class AvisoUrgenteDto
{
    public Guid Id { get; set; }
    public string Mensaje { get; set; } = null!;
    public bool Activo { get; set; }
    public DateTime CreatedAt { get; set; }
}
