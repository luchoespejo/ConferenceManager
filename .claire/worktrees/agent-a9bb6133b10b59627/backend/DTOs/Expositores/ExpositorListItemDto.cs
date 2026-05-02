namespace ConferenceManager.DTOs.Expositores;

public class ExpositorListItemDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Bio { get; set; }
    public string? FotoUrl { get; set; }
    public string? Email { get; set; }
    public Dictionary<string, string>? RedesSociales { get; set; }
    public DateTime CreadoEn { get; set; }
}
