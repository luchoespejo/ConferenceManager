using ConferenceManager.Data;
using ConferenceManager.DTOs.Auth;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ConferenceManager.Tests;

public class AuthControllerTests : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> _options;
    private AppDbContext _context = null!;
    private AuthService _authService = null!;

    public AuthControllerTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    public async Task InitializeAsync()
    {
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();

        var jwtMock = new Mock<IJwtService>();
        var emailMock = new Mock<IEmailService>();
        var configMock = new Mock<IConfiguration>();
        var loggerMock = new Mock<ILogger<AuthService>>();

        configMock.Setup(c => c["App:BaseUrl"]).Returns("http://localhost:5001");

        _authService = new AuthService(_context, jwtMock.Object, emailMock.Object, configMock.Object, loggerMock.Object);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task Registro_WithValidRequest_CreateAndEmail()
    {
        var dto = new RegistroRequest("newuser@example.com", "SecurePass123!", "New User", "Org");

        var result = await _authService.RegistrarAsync(dto);

        Assert.True(result.Success);

        var user = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        Assert.NotNull(user);
        Assert.False(user.EmailVerificado);
        Assert.NotNull(user.VerificationToken);
        Assert.NotEmpty(user.VerificationToken);
    }

    [Fact]
    public async Task Registro_WithDuplicateEmail_Returns400()
    {
        var email = "test@example.com";
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = email,
            Nombre = "Test",
            PasswordHash = "hash",
            Organizacion = "Org",
            EmailVerificado = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        var dto = new RegistroRequest(email, "Password123!", "Another", "Org");
        var result = await _authService.RegistrarAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task Login_WithUnverifiedEmail_Fails()
    {
        var password = "Pass123!";
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "unverified@example.com",
            Nombre = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Organizacion = "Org",
            EmailVerificado = false,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginRequest("unverified@example.com", password);
        var result = await _authService.LoginAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_NOT_VERIFIED", result.ErrorCode);
    }
}
