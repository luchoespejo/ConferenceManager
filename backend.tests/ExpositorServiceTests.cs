using ConferenceManager.Data;
using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Tests;

public class ExpositorServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ExpositorService _svc;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();
    private readonly Guid _conferenciaId = Guid.NewGuid();

    public ExpositorServiceTests()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(opts);
        _svc = new ExpositorService(_db);

        _db.Conferencias.Add(new Conferencia
        {
            Id = _conferenciaId,
            UsuarioId = _userId,
            Nombre = "Test Conf",
            Slug = "test-conf",
            FechaInicio = DateOnly.FromDateTime(DateTime.Today),
            FechaFin = DateOnly.FromDateTime(DateTime.Today.AddDays(2)),
            Usuario = null!
        });
        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public async Task Create_ValidData_GeneratesTokenAcceso()
    {
        var dto = new CreateExpositorDto { Nombre = "Dr. Smith", Email = "smith@conf.com" };

        var result = await _svc.CreateAsync(_conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.NotNull(result.Data!.TokenAcceso);
        Assert.NotEmpty(result.Data.TokenAcceso);
        Assert.Equal("Dr. Smith", result.Data.Nombre);
    }

    [Fact]
    public async Task Create_WrongOwner_Fails()
    {
        var dto = new CreateExpositorDto { Nombre = "X" };
        var result = await _svc.CreateAsync(_conferenciaId, _otherUserId, dto);

        Assert.False(result.Success);
    }

    [Fact]
    public async Task GetAll_IncludesTokenAcceso()
    {
        _db.Expositores.Add(new Expositor
        {
            ConferenciaId = _conferenciaId,
            Nombre = "Prof. García",
            TokenAcceso = "my-token-123",
            Conferencia = null!
        });
        await _db.SaveChangesAsync();

        var result = await _svc.GetAllAsync(_conferenciaId, _userId);

        Assert.True(result.Success);
        var expositor = result.Data!.First();
        Assert.Equal("my-token-123", expositor.TokenAcceso);
    }

    [Fact]
    public async Task GetById_NotFound_ReturnsError()
    {
        var result = await _svc.GetByIdAsync(Guid.NewGuid(), _conferenciaId, _userId);

        Assert.False(result.Success);
        Assert.Equal(ExpositorErrorCodes.NotFound, result.ErrorCode);
    }

    [Fact]
    public async Task Update_PartialFields_OnlyUpdateProvided()
    {
        var expositor = new Expositor
        {
            ConferenciaId = _conferenciaId,
            Nombre = "Original",
            Email = "orig@test.com",
            TokenAcceso = Guid.NewGuid().ToString(),
            Conferencia = null!
        };
        _db.Expositores.Add(expositor);
        await _db.SaveChangesAsync();

        var dto = new UpdateExpositorDto { Nombre = "Actualizado" };
        var result = await _svc.UpdateAsync(expositor.Id, _conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("Actualizado", result.Data!.Nombre);
        Assert.Equal("orig@test.com", result.Data.Email);
    }

    [Fact]
    public async Task Delete_WithNoSessions_Succeeds()
    {
        var expositor = new Expositor
        {
            ConferenciaId = _conferenciaId,
            Nombre = "Sin sesiones",
            TokenAcceso = Guid.NewGuid().ToString(),
            Conferencia = null!
        };
        _db.Expositores.Add(expositor);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(expositor.Id, _conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Equal(0, await _db.Expositores.CountAsync());
    }

    [Fact]
    public async Task Delete_WithSessions_Fails()
    {
        var expositor = new Expositor
        {
            ConferenciaId = _conferenciaId,
            Nombre = "Con sesiones",
            TokenAcceso = Guid.NewGuid().ToString(),
            Conferencia = null!
        };
        _db.Expositores.Add(expositor);

        var sala = new Sala { ConferenciaId = _conferenciaId, Nombre = "Sala A", Conferencia = null! };
        _db.Salas.Add(sala);
        await _db.SaveChangesAsync();

        _db.Sesiones.Add(new Sesion
        {
            ConferenciaId = _conferenciaId,
            SalaId = sala.Id,
            ExpositorId = expositor.Id,
            Titulo = "Charla",
            Fecha = DateOnly.FromDateTime(DateTime.Today),
            HoraInicio = new TimeOnly(9, 0),
            HoraFin = new TimeOnly(10, 0),
            Conferencia = null!, Sala = null!, Expositor = null!
        });
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(expositor.Id, _conferenciaId, _userId);

        Assert.False(result.Success);
        Assert.Equal(ExpositorErrorCodes.CannotDeleteWithSessions, result.ErrorCode);
    }

    [Fact]
    public async Task MapToDetalle_NullRedesSociales_DoesNotThrow()
    {
        var expositor = new Expositor
        {
            ConferenciaId = _conferenciaId,
            Nombre = "Sin redes",
            RedesSociales = null,
            TokenAcceso = Guid.NewGuid().ToString(),
            Conferencia = null!
        };
        _db.Expositores.Add(expositor);
        await _db.SaveChangesAsync();

        var result = await _svc.GetByIdAsync(expositor.Id, _conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Null(result.Data!.RedesSociales);
    }
}
