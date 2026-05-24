using System.Text.Json;

namespace ConferenceManager.Models;

public class Expositor
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Bio { get; set; }
    public string? FotoUrl { get; set; }
    public string? Email { get; set; }
    public JsonDocument? RedesSociales { get; set; }
    public string TokenAcceso { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public Conferencia Conferencia { get; set; } = null!;
}
