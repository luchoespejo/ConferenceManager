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

    // US-11: new text fields
    public string? Subtitulo { get; set; }
    public string? Lema { get; set; }
    public string? EmailContacto { get; set; }
    public string? Instagram { get; set; }
    public string? FormularioInscripcionUrl { get; set; }
    public string? ArancelesTexto { get; set; }
    public string? InformacionPago { get; set; }
    public string? ContactoAdicional { get; set; }

    // US-11: hero/banner display mode — "fondo" (dark overlay bg) | "decorativo" (inline image, light hero)
    public string BannerModo { get; set; } = "fondo";

    public ICollection<SeccionConfig> SeccionConfigs { get; set; } = [];

    // US-11: section visibility flags
    public bool MostrarFechas { get; set; } = true;
    public bool MostrarDescripcion { get; set; } = true;
    public bool MostrarOrganizadores { get; set; } = false;
    public bool MostrarContacto { get; set; } = true;
    public bool MostrarInscripciones { get; set; } = false;

    // Información adicional (richtext HTML)
    public string? InformacionAdicional { get; set; }
    public bool MostrarInformacion { get; set; } = false;

    // Programa section
    public bool MostrarPrograma { get; set; } = false;
    public string? ProgramaUrl { get; set; }        // /api/files/{id} or external URL
    public string? ProgramaAdicional { get; set; }  // richtext HTML

    public Usuario Usuario { get; set; } = null!;

    // US-11: navigation properties
    public ICollection<Organizador> Organizadores { get; set; } = [];
    public ICollection<FechaImportante> FechasImportantes { get; set; } = [];
    public ICollection<EjeTematico> EjesTematicos { get; set; } = [];

    // Layout builder (legacy single layout — kept for fallback)
    public string? LayoutJson { get; set; }

    public ICollection<ConferenciaLayout> Layouts { get; set; } = [];
}
