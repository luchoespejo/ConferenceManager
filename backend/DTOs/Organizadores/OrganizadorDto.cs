namespace ConferenceManager.DTOs.Organizadores;

public class OrganizadorDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public int Orden { get; set; }
}
