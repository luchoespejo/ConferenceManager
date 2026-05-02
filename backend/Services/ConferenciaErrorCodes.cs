namespace ConferenceManager.Services;

public static class ConferenciaErrorCodes
{
    public const string SlugAlreadyExists = "SLUG_ALREADY_EXISTS";
    public const string ConferenciaNotFound = "CONFERENCIA_NOT_FOUND";
    public const string FechaInicioAfterFechaFin = "FECHA_INICIO_AFTER_FECHA_FIN";
    public const string SlugInvalidFormat = "SLUG_INVALID_FORMAT";
    public const string CannotDeleteNonDraft = "CANNOT_DELETE_NON_DRAFT";
    public const string CannotChangeSlugNonDraft = "CANNOT_CHANGE_SLUG_NON_DRAFT";
    public const string CannotPublishNotDraft = "CANNOT_PUBLISH_NOT_DRAFT";
}
