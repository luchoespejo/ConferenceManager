using ConferenceManager.Application.Auth.Commands;
using ConferenceManager.DTOs.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConferenceManager.Controllers;

[Route("api/auth")]
[ApiController]
[AllowAnonymous]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("registro")]
    public async Task<IActionResult> Registro([FromBody] RegistroRequest dto)
    {
        var result = await mediator.Send(new RegisterCommand(dto.Email, dto.Password, dto.Nombre, dto.Organizacion));

        return result.Match<IActionResult>(
            _ => StatusCode(201, new { message = "Registro exitoso. Revisá tu email para verificar tu cuenta." }),
            errors => errors[0].Code switch
            {
                "EMAIL_ALREADY_EXISTS" => Conflict(new { error = errors[0].Code, message = errors[0].Description }),
                "INVALID_PASSWORD" => BadRequest(new { errors = new { password = new[] { errors[0].Description } } }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }

    [HttpGet("verificar-email")]
    public async Task<IActionResult> VerificarEmail([FromQuery] string token)
    {
        var result = await mediator.Send(new VerifyEmailCommand(token));

        return result.Match<IActionResult>(
            _ => Ok(new { message = "Email verificado correctamente. Ya podés iniciar sesión." }),
            errors => BadRequest(new { error = errors[0].Code, message = errors[0].Description }));
    }

    [HttpPost("reenviar-verificacion")]
    public async Task<IActionResult> ReenviarVerificacion([FromBody] ReenviarVerificacionRequest dto)
    {
        await mediator.Send(new ResendVerificationCommand(dto.Email));
        return Ok(new { message = "Si el email existe y no está verificado, recibirás un nuevo enlace." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest dto)
    {
        var result = await mediator.Send(new LoginCommand(dto.Email, dto.Password));

        return result.Match<IActionResult>(
            data => Ok(data),
            errors => errors[0].Code switch
            {
                "INVALID_CREDENTIALS" => Unauthorized(new { error = errors[0].Code, message = errors[0].Description }),
                "EMAIL_NOT_VERIFIED" => StatusCode(403, new { error = errors[0].Code, message = errors[0].Description }),
                _ => StatusCode(500, new { error = "INTERNAL_ERROR", message = "Error inesperado." })
            });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequest dto)
    {
        var result = await mediator.Send(new RefreshCommand(dto.RefreshToken));

        return result.Match<IActionResult>(
            data => Ok(data),
            errors => Unauthorized(new { error = errors[0].Code, message = errors[0].Description }));
    }

    [HttpGet("debug/hash")]
    public IActionResult GetHash([FromQuery] string password)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(password);
        return Ok(new { password, hash });
    }
}
