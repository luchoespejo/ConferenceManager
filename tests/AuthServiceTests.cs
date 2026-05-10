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

public class AuthServiceTests : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> _options;
    private AppDbContext _context = null!;
    private AuthService _authService = null!;
    private Mock<IJwtService> _jwtMock = null!;
    private Mock<IEmailService> _emailMock = null!;
    private Mock<IConfiguration> _configMock = null!;
    private Mock<ILogger<AuthService>> _loggerMock = null!;

    public AuthServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    public async Task InitializeAsync()
    {
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();

        _jwtMock = new Mock<IJwtService>();
        _emailMock = new Mock<IEmailService>();
        _configMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<AuthService>>();

        _configMock.Setup(c => c["App:BaseUrl"]).Returns("http://localhost:5001");

        _authService = new AuthService(_context, _jwtMock.Object, _emailMock.Object, _configMock.Object, _loggerMock.Object);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task RegistrarAsync_WithValidEmail_CreatesUser()
    {
        var dto = new RegistroRequest("test@example.com", "SecurePass123!", "Test User", "Test Org");

        var result = await _authService.RegistrarAsync(dto);

        Assert.True(result.Success, $"Expected success but got: {result.ErrorMessage}");

        var user = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        Assert.NotNull(user);
        Assert.Equal("Test User", user.Nombre);
        Assert.False(user.EmailVerificado);
    }

    [Fact]
    public async Task RegistrarAsync_WithDuplicateEmail_ReturnsFail()
    {
        var existing = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "duplicate@example.com",
            Nombre = "Existing",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Organizacion = "Org",
            EmailVerificado = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(existing);
        await _context.SaveChangesAsync();

        var dto = new RegistroRequest("duplicate@example.com", "NewPass123!", "New", "Org");

        var result = await _authService.RegistrarAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task RegistrarAsync_WithWeakPassword_ReturnsFail()
    {
        var dto = new RegistroRequest("test@example.com", "NoDigits", "Test", "Org");

        var result = await _authService.RegistrarAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("INVALID_PASSWORD", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsToken()
    {
        var password = "ValidPass123!";
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Nombre = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Organizacion = "Org",
            EmailVerificado = true,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        _jwtMock.Setup(j => j.GenerateAccessToken(It.IsAny<Usuario>())).Returns("access_token");
        _jwtMock.Setup(j => j.GenerateRefreshTokenRaw()).Returns("raw_refresh_token");
        _jwtMock.Setup(j => j.HashRefreshToken(It.IsAny<string>())).Returns("hashed_token");

        var dto = new LoginRequest("user@example.com", password);
        var result = await _authService.LoginAsync(dto);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.NotNull(result.Data.AccessToken);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ReturnsFail()
    {
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Nombre = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("CorrectPass123!"),
            Organizacion = "Org",
            EmailVerificado = true,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginRequest("user@example.com", "WrongPass123!");
        var result = await _authService.LoginAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("INVALID_CREDENTIALS", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_WithUnverifiedEmail_ReturnsFail()
    {
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "unverified@example.com",
            Nombre = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Organizacion = "Org",
            EmailVerificado = false,
            Activo = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginRequest("unverified@example.com", "Pass123!");
        var result = await _authService.LoginAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_NOT_VERIFIED", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_WithInactiveUser_ReturnsFail()
    {
        var user = new Usuario
        {
            Id = Guid.NewGuid(),
            Email = "inactive@example.com",
            Nombre = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass123!"),
            Organizacion = "Org",
            EmailVerificado = true,
            Activo = false,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(user);
        await _context.SaveChangesAsync();

        var dto = new LoginRequest("inactive@example.com", "Pass123!");
        var result = await _authService.LoginAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("ACCOUNT_DISABLED", result.ErrorCode);
    }

    [Fact]
    public async Task LoginAsync_WithNonexistentEmail_ReturnsFail()
    {
        var dto = new LoginRequest("nonexistent@example.com", "Pass123!");
        var result = await _authService.LoginAsync(dto);

        Assert.False(result.Success);
        Assert.Equal("INVALID_CREDENTIALS", result.ErrorCode);
    }
}
