namespace ConferenceManager.Models;

public class EjeTematico
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public Conferencia Conferencia { get; set; } = null!;
}
