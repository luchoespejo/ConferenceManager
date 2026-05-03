namespace ConferenceManager.DTOs.Public;

public class ExpositorPerfilDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? Bio { get; set; }
    public string? FotoUrl { get; set; }
    public string? Email { get; set; }
    public string ConferenciaNombre { get; set; } = null!;
    public List<SesionPublicaDto> Sesiones { get; set; } = [];
}
