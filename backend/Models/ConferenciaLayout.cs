namespace ConferenceManager.Models;

public class ConferenciaLayout
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string LayoutJson { get; set; } = null!;
    public bool IsActive { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Conferencia Conferencia { get; set; } = null!;
}
