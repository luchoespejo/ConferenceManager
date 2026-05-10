using ConferenceManager.Data;
using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ConferenceManager.Tests;

public class ConferenciaServiceTests : IAsyncLifetime
{
    private readonly DbContextOptions<AppDbContext> _options;
    private AppDbContext _context = null!;
    private ConferenciaService _service = null!;
    private Guid _usuarioId;

    public ConferenciaServiceTests()
    {
        _options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    public async Task InitializeAsync()
    {
        _context = new AppDbContext(_options);
        await _context.Database.EnsureCreatedAsync();

        _usuarioId = Guid.NewGuid();
        var usuario = new Usuario
        {
            Id = _usuarioId,
            Email = "user@example.com",
            Nombre = "Test User",
            PasswordHash = "hash",
            Organizacion = "Org",
            EmailVerificado = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        _service = new ConferenciaService(_context);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesConferencia()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Tech Conf 2026",
            Slug = "tech-conf-2026",
            Descripcion = "Description",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address"
        };

        var result = await _service.CreateAsync(dto, _usuarioId);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Tech Conf 2026", result.Data.Nombre);
        Assert.Equal("tech-conf-2026", result.Data.Slug);

        var saved = await _context.Conferencias
            .FirstOrDefaultAsync(c => c.Slug == dto.Slug);
        Assert.NotNull(saved);
        Assert.Equal(_usuarioId, saved.UsuarioId);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateSlug_ReturnsFail()
    {
        var existing = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = _usuarioId,
            Nombre = "Existing",
            Slug = "duplicate-slug",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            CreatedAt = DateTime.UtcNow
        };
        _context.Conferencias.Add(existing);
        await _context.SaveChangesAsync();

        var dto = new CreateConferenciaDto
        {
            Nombre = "New",
            Slug = "duplicate-slug",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address"
        };

        var result = await _service.CreateAsync(dto, _usuarioId);

        Assert.False(result.Success);
        Assert.Equal("SLUG_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_WithInvalidDateRange_ReturnsFail()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Tech Conf",
            Slug = "tech-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-02"),
            FechaFin = DateOnly.Parse("2026-06-01"),
            VenueNombre = "Venue",
            VenueDireccion = "Address"
        };

        var result = await _service.CreateAsync(dto, _usuarioId);

        Assert.False(result.Success);
        Assert.Equal("FECHA_INICIO_AFTER_FECHA_FIN", result.ErrorCode);
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_UpdatesConferencia()
    {
        var conf = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = _usuarioId,
            Nombre = "Original",
            Slug = "original-slug",
            Descripcion = "Original desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };
        _context.Conferencias.Add(conf);
        await _context.SaveChangesAsync();

        var dto = new UpdateConferenciaDto
        {
            Nombre = "Updated",
            Descripcion = "Updated desc"
        };

        var result = await _service.UpdateAsync(conf.Id, dto, _usuarioId);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Updated", result.Data.Nombre);
        Assert.Equal("Updated desc", result.Data.Descripcion);

        var updated = await _context.Conferencias
            .FirstOrDefaultAsync(c => c.Id == conf.Id);
        Assert.NotNull(updated);
        Assert.Equal("Updated", updated.Nombre);
    }

    [Fact]
    public async Task UpdateAsync_WithNonexistentConferencia_ReturnsFail()
    {
        var dto = new UpdateConferenciaDto { Nombre = "Updated" };
        var result = await _service.UpdateAsync(Guid.NewGuid(), dto, _usuarioId);

        Assert.False(result.Success);
        Assert.Equal("CONFERENCIA_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task UpdateAsync_WithOtherUserConferencia_ReturnsFail()
    {
        var otherUserId = Guid.NewGuid();
        var conf = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = otherUserId,
            Nombre = "Other User Conf",
            Slug = "other-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };
        _context.Conferencias.Add(conf);
        await _context.SaveChangesAsync();

        var dto = new UpdateConferenciaDto { Nombre = "Updated" };
        var result = await _service.UpdateAsync(conf.Id, dto, _usuarioId);

        Assert.False(result.Success);
        Assert.Equal("CONFERENCIA_NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetMisConferenciasAsync_ReturnsOnlyUserConferencias()
    {
        var conf1 = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = _usuarioId,
            Nombre = "My Conf",
            Slug = "my-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };

        var otherUserId = Guid.NewGuid();
        var conf2 = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = otherUserId,
            Nombre = "Other Conf",
            Slug = "other-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };

        _context.Conferencias.AddRange(conf1, conf2);
        await _context.SaveChangesAsync();

        var result = await _service.GetMisConferenciasAsync(_usuarioId);

        Assert.Single(result);
        Assert.Equal(conf1.Id, result.First().Id);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ReturnsConferencia()
    {
        var conf = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = _usuarioId,
            Nombre = "Test Conf",
            Slug = "test-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };
        _context.Conferencias.Add(conf);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(conf.Id, _usuarioId);

        Assert.NotNull(result);
        Assert.Equal(conf.Id, result.Id);
        Assert.Equal("Test Conf", result.Nombre);
    }

    [Fact]
    public async Task GetByIdAsync_WithOtherUserConferencia_ReturnsNull()
    {
        var otherUserId = Guid.NewGuid();
        var conf = new Conferencia
        {
            Id = Guid.NewGuid(),
            UsuarioId = otherUserId,
            Nombre = "Other Conf",
            Slug = "other-conf",
            Descripcion = "Desc",
            FechaInicio = DateOnly.Parse("2026-06-01"),
            FechaFin = DateOnly.Parse("2026-06-02"),
            VenueNombre = "Venue",
            VenueDireccion = "Address",
            Estado = ConferenciaEstado.Borrador,
            CreatedAt = DateTime.UtcNow
        };
        _context.Conferencias.Add(conf);
        await _context.SaveChangesAsync();

        var result = await _service.GetByIdAsync(conf.Id, _usuarioId);

        Assert.Null(result);
    }
}
