namespace ConferenceManager.DTOs.Public;

public class ConferenciaPublicaDto
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public string? LogoUrl { get; set; }
    public string? LogoSecundarioUrl { get; set; }
    public string? ColorPrimario { get; set; }
    public string? ColorSecundario { get; set; }
    public string? Tipografia { get; set; }
    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public string? VenueLinkMaps { get; set; }
}
