namespace ConferenceManager.Models;

public class Conferencia
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string Nombre { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public ConferenciaEstado Estado { get; set; } = ConferenciaEstado.Borrador;
    public string? LogoUrl { get; set; }
    public string? LogoSecundarioUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public string? ColorPrimario { get; set; }
    public string? ColorSecundario { get; set; }
    public string? Tipografia { get; set; }
    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public string? VenueLinkMaps { get; set; }
    public DateTime CreatedAt { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
