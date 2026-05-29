using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Conferencias;

public class UpdateConferenciaDto
{
    [MaxLength(255)]
    public string? Nombre { get; set; }

    [MaxLength(50), RegularExpression(@"^[a-z0-9-]{3,50}$",
        ErrorMessage = "El slug solo puede contener letras minúsculas, números y guiones, con longitud entre 3 y 50 caracteres.")]
    public string? Slug { get; set; }

    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    [MaxLength(7)]
    public string? ColorPrimario { get; set; }

    [MaxLength(7)]
    public string? ColorSecundario { get; set; }

    [MaxLength(100)]
    public string? Tipografia { get; set; }

    public string? LogoUrl { get; set; }
    public string? LogoSecundarioUrl { get; set; }
    public string? BannerUrl { get; set; }
    public string? FaviconUrl { get; set; }

    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public string? VenueLinkMaps { get; set; }

    // US-11
    public string? BannerModo { get; set; }
    public string? Subtitulo { get; set; }
    public string? Lema { get; set; }
    public string? EmailContacto { get; set; }
    public string? Instagram { get; set; }
    public string? FormularioInscripcionUrl { get; set; }
    public string? ArancelesTexto { get; set; }
    public string? InformacionPago { get; set; }
    public string? ContactoAdicional { get; set; }
    public bool? MostrarFechas { get; set; }
    public bool? MostrarDescripcion { get; set; }
    public bool? MostrarOrganizadores { get; set; }
    public bool? MostrarContacto { get; set; }
    public bool? MostrarInscripciones { get; set; }

    // Información adicional (richtext HTML)
    public string? InformacionAdicional { get; set; }
    public bool? MostrarInformacion { get; set; }
}
