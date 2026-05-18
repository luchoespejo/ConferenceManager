namespace ConferenceManager.DTOs.Conferencias;

public class ConferenciaDetalleDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Descripcion { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public string Estado { get; set; } = null!;
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

    // US-11
    public string BannerModo { get; set; } = "fondo";
    public string? Subtitulo { get; set; }
    public string? Lema { get; set; }
    public string? EmailContacto { get; set; }
    public string? Instagram { get; set; }
    public string? FormularioInscripcionUrl { get; set; }
    public string? ArancelesTexto { get; set; }
    public string? InformacionPago { get; set; }
    public string? ContactoAdicional { get; set; }
    public bool MostrarFechas { get; set; }
    public bool MostrarDescripcion { get; set; }
    public bool MostrarOrganizadores { get; set; }
    public bool MostrarContacto { get; set; }
    public bool MostrarInscripciones { get; set; }

    public DateTime CreadoEn { get; set; }
}
