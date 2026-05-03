using ConferenceManager.Data;
using ConferenceManager.DTOs.AvisosUrgentes;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Tests;

public class AvisoUrgenteServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly AvisoUrgenteService _svc;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();
    private readonly Guid _conferenciaId = Guid.NewGuid();

    public AvisoUrgenteServiceTests()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(opts);
        _svc = new AvisoUrgenteService(_db);

        var conferencia = new Conferencia
        {
            Id = _conferenciaId,
            UsuarioId = _userId,
            Nombre = "Test Conf",
            Slug = "test-conf",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today),
            FechaFin = DateOnly.FromDateTime(DateTime.Today.AddDays(2)),
            Usuario = null!
        };
        _db.Conferencias.Add(conferencia);
        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task GetAll_WrongOwner_ReturnsNotFound()
    {
        var result = await _svc.GetAllAsync(_conferenciaId, _otherUserId);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetAll_CorrectOwner_ReturnsEmptyList()
    {
        var result = await _svc.GetAllAsync(_conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Empty(result.Data);
    }

    [Fact]
    public async Task Create_ValidData_ReturnsDto()
    {
        var dto = new CreateAvisoUrgenteDto { Mensaje = "Sala cambiada", Activo = true };

        var result = await _svc.CreateAsync(_conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("Sala cambiada", result.Data!.Mensaje);
        Assert.True(result.Data.Activo);
    }

    [Fact]
    public async Task Create_WrongOwner_Fails()
    {
        var dto = new CreateAvisoUrgenteDto { Mensaje = "X", Activo = true };

        var result = await _svc.CreateAsync(_conferenciaId, _otherUserId, dto);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task Update_Mensaje_UpdatesOnly()
    {
        var aviso = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "Original", Activo = true };
        _db.AvisosUrgentes.Add(aviso);
        await _db.SaveChangesAsync();

        var dto = new UpdateAvisoUrgenteDto { Mensaje = "Nuevo mensaje" };
        var result = await _svc.UpdateAsync(aviso.Id, _conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("Nuevo mensaje", result.Data!.Mensaje);
        Assert.True(result.Data.Activo);
    }

    [Fact]
    public async Task Update_EmptyMensaje_DoesNotOverwrite()
    {
        var aviso = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "Original", Activo = true };
        _db.AvisosUrgentes.Add(aviso);
        await _db.SaveChangesAsync();

        var dto = new UpdateAvisoUrgenteDto { Mensaje = "   " };
        var result = await _svc.UpdateAsync(aviso.Id, _conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("Original", result.Data!.Mensaje);
    }

    [Fact]
    public async Task Update_ToggleActivo_Works()
    {
        var aviso = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "X", Activo = true };
        _db.AvisosUrgentes.Add(aviso);
        await _db.SaveChangesAsync();

        var dto = new UpdateAvisoUrgenteDto { Activo = false };
        var result = await _svc.UpdateAsync(aviso.Id, _conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.False(result.Data!.Activo);
    }

    [Fact]
    public async Task Update_NotFound_Fails()
    {
        var dto = new UpdateAvisoUrgenteDto { Mensaje = "X" };
        var result = await _svc.UpdateAsync(Guid.NewGuid(), _conferenciaId, _userId, dto);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task Delete_Existing_Succeeds()
    {
        var aviso = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "X", Activo = true };
        _db.AvisosUrgentes.Add(aviso);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(aviso.Id, _conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Equal(0, await _db.AvisosUrgentes.CountAsync());
    }

    [Fact]
    public async Task Delete_NotFound_Fails()
    {
        var result = await _svc.DeleteAsync(Guid.NewGuid(), _conferenciaId, _userId);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetAll_ReturnsOrderedByCreatedAtDesc()
    {
        var a1 = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "Primero", Activo = true, CreatedAt = DateTime.UtcNow.AddMinutes(-10) };
        var a2 = new AvisoUrgente { ConferenciaId = _conferenciaId, Mensaje = "Segundo", Activo = true, CreatedAt = DateTime.UtcNow };
        _db.AvisosUrgentes.AddRange(a1, a2);
        await _db.SaveChangesAsync();

        var result = await _svc.GetAllAsync(_conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Equal("Segundo", result.Data![0].Mensaje);
        Assert.Equal("Primero", result.Data[1].Mensaje);
    }
}
