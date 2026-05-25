using System.Text.RegularExpressions;
using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Models;
using ConferenceManager.Services;
using ErrorOr;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Auth.Commands;

public class RegisterCommandHandler(
    IAppDbContext context,
    IEmailService emailService,
    IConfiguration configuration,
    ILogger<RegisterCommandHandler> logger) : IRequestHandler<RegisterCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var exists = await context.Usuarios
            .AsNoTracking()
            .AnyAsync(u => u.Email == command.Email, cancellationToken);

        if (exists)
            return Error.Conflict("EMAIL_ALREADY_EXISTS", "El email ya está registrado.");

        if (!Regex.IsMatch(command.Password, @"\d"))
            return Error.Validation("INVALID_PASSWORD", "La contraseña debe contener al menos un número.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(command.Password, workFactor: 12);
        var verificationToken = Guid.NewGuid().ToString("N");

        var usuario = new Usuario
        {
            Email = command.Email,
            PasswordHash = passwordHash,
            Nombre = command.Nombre,
            Organizacion = command.Organizacion ?? string.Empty,
            EmailVerificado = false,
            VerificationToken = verificationToken,
            VerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)
        };

        context.Usuarios.Add(usuario);
        await context.SaveChangesAsync(cancellationToken);

        var baseUrl = configuration["App:BaseUrl"] ?? "http://localhost:5001";
        var verificationUrl = $"{baseUrl}/api/auth/verificar-email?token={verificationToken}";

        try
        {
            await emailService.SendVerificationEmailAsync(command.Email, command.Nombre, verificationUrl);
        }
        catch (EmailDeliveryException ex)
        {
            logger.LogWarning(ex, "Failed to send verification email to {Email}", command.Email);
            // Registration succeeded; email failure is logged but not surfaced to client
        }

        return Result.Success;
    }
}
