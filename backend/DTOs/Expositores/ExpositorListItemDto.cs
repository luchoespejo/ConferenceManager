namespace ConferenceManager.DTOs.Expositores;

public class ExpositorListItemDto
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Email { get; set; }
    public string? FotoUrl { get; set; }
}
