namespace ConferenceManager.DTOs.Participantes;

public class ParticipanteListItemDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Empresa { get; set; }
    public bool PuedeGenerarCertificado { get; set; }
    public DateTime CreatedAt { get; set; }
}
