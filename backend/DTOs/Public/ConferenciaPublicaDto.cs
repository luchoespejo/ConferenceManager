namespace ConferenceManager.DTOs.Public;

public class SeccionConfigPublicaDto
{
    public string SeccionKey { get; set; } = null!;
    public string? BgColor { get; set; }
    public string? TextoColor { get; set; }
    public string? FontSize { get; set; }
    public int? LogoAltura { get; set; }
}

public class OrganizadorPublicoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public int Orden { get; set; }
}

public class FechaImportantePublicaDto
{
    public Guid Id { get; set; }
    public string Descripcion { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public DateOnly? FechaFin { get; set; }
}

public class EjeTematicoPublicoDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
}

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
    public string? BannerUrl { get; set; }
    public string? ColorPrimario { get; set; }
    public string? ColorSecundario { get; set; }
    public string? Tipografia { get; set; }
    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public string? VenueLinkMaps { get; set; }

    // US-11
    public string? Subtitulo { get; set; }
    public string? Lema { get; set; }
    public string? EmailContacto { get; set; }
    public string? Instagram { get; set; }
    public string? FormularioInscripcionUrl { get; set; }
    public string? ArancelesTexto { get; set; }
    public string? InformacionPago { get; set; }
    public string? ContactoAdicional { get; set; }

    public string BannerModo { get; set; } = "fondo";
    public List<SeccionConfigPublicaDto> SeccionConfigs { get; set; } = [];

    public bool MostrarFechas { get; set; }
    public bool MostrarDescripcion { get; set; }
    public bool MostrarOrganizadores { get; set; }
    public bool MostrarContacto { get; set; }
    public bool MostrarInscripciones { get; set; }
    public bool TieneSesiones { get; set; }
    public bool TieneExpositores { get; set; }

    public List<OrganizadorPublicoDto> Organizadores { get; set; } = [];
    public List<FechaImportantePublicaDto> FechasImportantes { get; set; } = [];
    public List<EjeTematicoPublicoDto> EjesTematicos { get; set; } = [];
}
