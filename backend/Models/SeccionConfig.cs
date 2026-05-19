namespace ConferenceManager.Models;

public class SeccionConfig
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }

    /// <summary>Identifies the site section: "hero","fechas","descripcion","organizadores","contacto"</summary>
    public string SeccionKey { get; set; } = null!;

    public string? BgColor { get; set; }
    public string? TextoColor { get; set; }
    public string? FontSize { get; set; }
    /// <summary>Logo height in px for the organizadores section (default 44)</summary>
    public int? LogoAltura { get; set; }

    public Conferencia Conferencia { get; set; } = null!;
}
