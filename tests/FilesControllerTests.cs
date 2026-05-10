using ConferenceManager.Data;
using ConferenceManager.Features.Files.Commands;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ConferenceManager.Tests;

public class FilesControllerTests : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> _options;
    private AppDbContext _context = null!;
    private UploadImageCommandHandler _handler = null!;

    public FilesControllerTests()
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
    public async Task UploadImage_WithValidBase64_StoresAndReturnsUrl()
    {
        var pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, pngBase64, "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.True(result.Success);
        Assert.NotNull(result.Data?.Url);
        Assert.StartsWith("/api/files/", result.Data.Url);
    }

    [Fact]
    public async Task UploadImage_WithInvalidType_ReturnsBadRequest()
    {
        var pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, pngBase64, "application/pdf");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("INVALID_TYPE", result.ErrorCode);
    }

    [Fact]
    public async Task UploadImage_WithEmptyData_ReturnsBadRequest()
    {
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, "", "image/png");

        var result = await _handler.ExecuteAsync(command);

        Assert.False(result.Success);
        Assert.Equal("MISSING_DATA", result.ErrorCode);
    }

    [Fact]
    public async Task UploadImage_StoresDataInDatabase()
    {
        var pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";
        var usuarioId = Guid.NewGuid();
        var command = new UploadImageCommand(usuarioId, pngBase64, "image/png");

        var result = await _handler.ExecuteAsync(command);

        var stored = await _context.ImagenesAlmacenadas
            .FirstOrDefaultAsync(i => i.Id == result.Data!.Id);

        Assert.NotNull(stored);
        Assert.Equal(usuarioId, stored.UsuarioId);
        Assert.Equal("image/png", stored.ContentType);
    }
}
