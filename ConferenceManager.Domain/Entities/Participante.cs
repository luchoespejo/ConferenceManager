namespace ConferenceManager.Models;

public class Participante
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Empresa { get; set; }
    public bool PuedeGenerarCertificado { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public Conferencia Conferencia { get; set; } = null!;
}
