namespace ConferenceManager.Services;

public static class SalaErrorCodes
{
    public const string ConferenciaNotFound = "CONFERENCIA_NOT_FOUND";
    public const string SalaNotFound = "SALA_NOT_FOUND";
    public const string NombreAlreadyExists = "NOMBRE_ALREADY_EXISTS";
    public const string CannotDeleteWithSesiones = "CANNOT_DELETE_WITH_SESIONES";
    public const string CapacidadInvalid = "CAPACIDAD_INVALID";
}
