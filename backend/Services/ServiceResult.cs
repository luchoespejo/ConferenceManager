namespace ConferenceManager.Services;

public class ServiceResult
{
    public bool Success { get; protected set; }
    public string? ErrorCode { get; protected set; }
    public string? ErrorMessage { get; protected set; }

    protected ServiceResult() { }

    public static ServiceResult Ok() => new() { Success = true };
    public static ServiceResult Fail(string errorCode, string? errorMessage = null) =>
        new() { Success = false, ErrorCode = errorCode, ErrorMessage = errorMessage };
}

public class ServiceResult<T> : ServiceResult
{
    public T? Data { get; private set; }

    private ServiceResult() { }

    public static ServiceResult<T> Ok(T data) =>
        new() { Success = true, Data = data };

    public new static ServiceResult<T> Fail(string errorCode, string? errorMessage = null) =>
        new() { Success = false, ErrorCode = errorCode, ErrorMessage = errorMessage };
}

public static class AuthErrorCodes
{
    public const string EmailAlreadyExists = "EMAIL_ALREADY_EXISTS";
    public const string InvalidCredentials = "INVALID_CREDENTIALS";
    public const string EmailNotVerified = "EMAIL_NOT_VERIFIED";
    public const string TokenInvalid = "TOKEN_INVALID";
    public const string TokenExpired = "TOKEN_EXPIRED";
    public const string RefreshTokenInvalid = "REFRESH_TOKEN_INVALID";
}
