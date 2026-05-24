namespace ConferenceManager.Models;

public class Organizador
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public int Orden { get; set; }

    public Conferencia Conferencia { get; set; } = null!;
}
