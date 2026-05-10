using ConferenceManager.Data;
using ConferenceManager.Features.Files.Commands;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ConferenceManager.Tests;

public class UploadImageCommandHandlerTests : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> _options;
    private AppDbContext _context = null!;
    private UploadImageCommandHandler _handler = null!;

    public UploadImageCommandHandlerTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    public async Task InitializeAsync()
    {
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();
        _handler = new UploadImageCommandHandler(_context);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task ExecuteAsync_WithValidPNGBase64_SavesImage()
    {
        var pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, pngBase64, "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.StartsWith("/api/files/", result.Data.Url);
        Assert.NotEqual(Guid.Empty, result.Data.Id);

        var saved = await _context.ImagenesAlmacenadas
            .FirstOrDefaultAsync(i => i.Id == result.Data.Id);
        Assert.NotNull(saved);
        Assert.Equal("image/png", saved.ContentType);
        Assert.Equal(usuarioId, saved.UsuarioId);
        Assert.True(saved.Datos.Length > 0);
    }

    [Fact]
    public async Task ExecuteAsync_WithDataURIPrefix_ExtractsCorrectly()
    {
        var dataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, dataUri, null);

        var result = await _handler.ExecuteAsync(command);

        Assert.True(result.Success);
        var saved = await _context.ImagenesAlmacenadas
            .FirstOrDefaultAsync(i => i.Id == result.Data!.Id);
        Assert.NotNull(saved);
        Assert.Equal("image/png", saved.ContentType);
    }

    [Fact]
    public async Task ExecuteAsync_WithInvalidBase64_ReturnsFail()
    {
        var invalidBase64 = "not-valid-base64!!!";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, invalidBase64, "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("INVALID_BASE64", result.ErrorCode);
    }

    [Fact]
    public async Task ExecuteAsync_WithUnsupportedImageType_ReturnsFail()
    {
        var base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, base64, "application/json");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("INVALID_TYPE", result.ErrorCode);
        Assert.Contains("JPG, PNG, WebP, GIF", result.ErrorMessage);
    }

    [Fact]
    public async Task ExecuteAsync_WithMissingBase64_ReturnsFail()
    {
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, "", "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("MISSING_DATA", result.ErrorCode);
    }

    [Fact]
    public async Task ExecuteAsync_WithFileTooLarge_ReturnsFail()
    {
        var largeBytes = new byte[513 * 1024];
        var largeData = Convert.ToBase64String(largeBytes);
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, largeData, "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("FILE_TOO_LARGE", result.ErrorCode);
        Assert.Contains("500 KB", result.ErrorMessage);
    }

    [Theory]
    [InlineData("image/jpeg")]
    [InlineData("image/png")]
    [InlineData("image/webp")]
    [InlineData("image/gif")]
    [InlineData("image/x-icon")]
    [InlineData("image/vnd.microsoft.icon")]
    public async Task ExecuteAsync_WithAllowedTypes_Succeeds(string contentType)
    {
        var base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, base64, contentType);

        var result = await _handler.ExecuteAsync(command);

        Assert.True(result.Success);
    }

    [Fact]
    public async Task ExecuteAsync_WithWhitespaceBase64_ReturnsFail()
    {
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, "   ", "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("MISSING_DATA", result.ErrorCode);
    }
}
