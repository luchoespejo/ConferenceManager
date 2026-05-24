using ErrorOr;
using Microsoft.AspNetCore.Mvc;

namespace ConferenceManager.Extensions;

/// <summary>
/// Maps an <see cref="ErrorOr{T}"/> result (Application layer) to an MVC
/// <see cref="IActionResult"/>. Shared by every controller migrated to Clean Architecture
/// so HTTP status mapping stays consistent. Error body mirrors the legacy shape
/// (<c>{ error, message }</c>) to keep API contracts stable.
/// </summary>
public static class ErrorOrExtensions
{
    public static IActionResult ToActionResult<T>(this ErrorOr<T> result)
    {
        if (!result.IsError)
            return new OkObjectResult(result.Value);

        var first = result.FirstError;
        var status = first.Type switch
        {
            ErrorType.Validation   => StatusCodes.Status400BadRequest,
            ErrorType.NotFound     => StatusCodes.Status404NotFound,
            ErrorType.Conflict     => StatusCodes.Status409Conflict,
            ErrorType.Unauthorized => StatusCodes.Status401Unauthorized,
            ErrorType.Forbidden    => StatusCodes.Status403Forbidden,
            _                      => StatusCodes.Status500InternalServerError,
        };

        return new ObjectResult(new { error = first.Code, message = first.Description })
        {
            StatusCode = status
        };
    }
}
