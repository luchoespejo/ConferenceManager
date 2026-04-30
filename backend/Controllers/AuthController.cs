using ConferenceManager.DTOs.Auth;
using ConferenceManager.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConferenceManager.Controllers;

[Route("api/auth")]
[ApiController]
[AllowAnonymous]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("registro")]
    public async Task<IActionResult> Registro([FromBody] RegistroRequest dto)
    {
        var result = await authService.RegistrarAsync(dto);

        if (result.Success)
            return StatusCode(201, new { message = "Registro exitoso. Revisá tu email para verificar tu cuenta." });

        return result.ErrorCode switch
        {
            "EMAIL_ALREADY_EXISTS" => Conflict(new { error = result.ErrorCode, message = result.ErrorMessage }),
            "INVALID_PASSWORD" => BadRequest(new { errors = new { password = new[] { result.ErrorMessage } } }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpGet("verificar-email")]
    public async Task<IActionResult> VerificarEmail([FromQuery] string token)
    {
        var result = await authService.VerificarEmailAsync(token);

        if (result.Success)
            return Ok(new { message = "Email verificado correctamente. Ya podés iniciar sesión." });

        return BadRequest(new { error = result.ErrorCode, message = result.ErrorMessage });
    }

    [HttpPost("reenviar-verificacion")]
    public async Task<IActionResult> ReenviarVerificacion([FromBody] ReenviarVerificacionRequest dto)
    {
        await authService.ReenviarVerificacionAsync(dto.Email);
        return Ok(new { message = "Si el email existe y no está verificado, recibirás un nuevo enlace." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest dto)
    {
        var result = await authService.LoginAsync(dto);

        if (result.Success)
            return Ok(result.Data);

        return result.ErrorCode switch
        {
            "INVALID_CREDENTIALS" => Unauthorized(new { error = result.ErrorCode, message = result.ErrorMessage }),
            "EMAIL_NOT_VERIFIED" => StatusCode(403, new { error = result.ErrorCode, message = result.ErrorMessage }),
            _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
        };
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest dto)
    {
        var result = await authService.RefreshAsync(dto.RefreshToken);

        if (result.Success)
            return Ok(result.Data);

        return Unauthorized(new { error = result.ErrorCode, message = result.ErrorMessage });
    }
}
