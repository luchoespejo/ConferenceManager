namespace ConferenceManager.DTOs.Conferencias;

public class ConferenciaOverviewDto
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string Estado { get; set; } = null!;
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public string? ColorPrimario { get; set; }
    public string? VenueNombre { get; set; }
    public string? VenueDireccion { get; set; }
    public int TotalSesiones { get; set; }
    public int TotalExpositores { get; set; }
    public int TotalSalas { get; set; }
    public int TotalParticipantes { get; set; }
    public List<SesionProximaDto> ProximasSesiones { get; set; } = [];
}

public class SesionProximaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = null!;
    public DateOnly Fecha { get; set; }
    public TimeOnly HoraInicio { get; set; }
    public TimeOnly HoraFin { get; set; }
    public string SalaNombre { get; set; } = null!;
    public string ExpositorNombre { get; set; } = null!;
    public string? Track { get; set; }
}
