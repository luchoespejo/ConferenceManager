namespace ConferenceManager.Services;

public static class SesionErrorCodes
{
    public const string NotFound = "SESION_NOT_FOUND";
    public const string ConferenciaNotFound = "CONFERENCIA_NOT_FOUND";
    public const string SalaNotFound = "SALA_NOT_FOUND";
    public const string SalaNotInConferencia = "SALA_NOT_IN_CONFERENCIA";
    public const string ExpositorNotFound = "EXPOSITOR_NOT_FOUND";
    public const string ExpositorNotInConferencia = "EXPOSITOR_NOT_IN_CONFERENCIA";
    public const string InvalidDateRange = "INVALID_DATE_RANGE";
    public const string InvalidTimeRange = "INVALID_TIME_RANGE";
}
