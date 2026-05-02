namespace ConferenceManager.DTOs.Public;

public class AvisoUrgentePublicoDto
{
    public Guid Id { get; set; }
    public string Mensaje { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
