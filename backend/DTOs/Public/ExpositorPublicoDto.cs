using System.Collections.Generic;

namespace ConferenceManager.DTOs.Public;

public class ExpositorPublicoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Bio { get; set; }
    public string? FotoUrl { get; set; }
    public Dictionary<string, string>? RedesSociales { get; set; }
}
