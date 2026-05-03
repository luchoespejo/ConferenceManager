using ConferenceManager.Data;
using ConferenceManager.DTOs.Participantes;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Tests;

public class ParticipanteServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ParticipanteService _svc;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();
    private readonly Guid _conferenciaId = Guid.NewGuid();

    public ParticipanteServiceTests()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(opts);
        _svc = new ParticipanteService(_db);

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
    public async Task Create_NewParticipante_Succeeds()
    {
        var dto = new CreateParticipanteDto { Nombre = "Ana García", Email = "ana@test.com" };

        var result = await _svc.CreateAsync(_conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("Ana García", result.Data!.Nombre);
        Assert.Equal("ana@test.com", result.Data.Email);
        Assert.False(result.Data.PuedeGenerarCertificado);
    }

    [Fact]
    public async Task Create_DuplicateEmail_Fails()
    {
        _db.Participantes.Add(new Participante { ConferenciaId = _conferenciaId, Nombre = "Juan", Email = "juan@test.com" });
        await _db.SaveChangesAsync();

        var dto = new CreateParticipanteDto { Nombre = "Juan2", Email = "juan@test.com" };
        var result = await _svc.CreateAsync(_conferenciaId, _userId, dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task Create_WrongOwner_Fails()
    {
        var dto = new CreateParticipanteDto { Nombre = "X", Email = "x@x.com" };
        var result = await _svc.CreateAsync(_conferenciaId, _otherUserId, dto);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task GetAll_ReturnsOrderedByNombre()
    {
        _db.Participantes.AddRange(
            new Participante { ConferenciaId = _conferenciaId, Nombre = "Zeta", Email = "z@test.com" },
            new Participante { ConferenciaId = _conferenciaId, Nombre = "Alpha", Email = "a@test.com" }
        );
        await _db.SaveChangesAsync();

        var result = await _svc.GetAllAsync(_conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Equal("Alpha", result.Data![0].Nombre);
        Assert.Equal("Zeta", result.Data[1].Nombre);
    }

    [Fact]
    public async Task GetById_NotFound_Fails()
    {
        var result = await _svc.GetByIdAsync(Guid.NewGuid(), _conferenciaId, _userId);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }

    [Fact]
    public async Task Update_ChangesEmail_WhenNotDuplicate()
    {
        var p = new Participante { ConferenciaId = _conferenciaId, Nombre = "Carlos", Email = "carlos@test.com" };
        _db.Participantes.Add(p);
        await _db.SaveChangesAsync();

        var dto = new UpdateParticipanteDto { Email = "carlos-nuevo@test.com" };
        var result = await _svc.UpdateAsync(p.Id, _conferenciaId, _userId, dto);

        Assert.True(result.Success);
        Assert.Equal("carlos-nuevo@test.com", result.Data!.Email);
    }

    [Fact]
    public async Task Update_DuplicateEmail_Fails()
    {
        var p1 = new Participante { ConferenciaId = _conferenciaId, Nombre = "P1", Email = "p1@test.com" };
        var p2 = new Participante { ConferenciaId = _conferenciaId, Nombre = "P2", Email = "p2@test.com" };
        _db.Participantes.AddRange(p1, p2);
        await _db.SaveChangesAsync();

        var dto = new UpdateParticipanteDto { Email = "p1@test.com" };
        var result = await _svc.UpdateAsync(p2.Id, _conferenciaId, _userId, dto);

        Assert.False(result.Success);
        Assert.Equal("EMAIL_ALREADY_EXISTS", result.ErrorCode);
    }

    [Fact]
    public async Task ToggleCertificado_EnablesAndDisables()
    {
        var p = new Participante { ConferenciaId = _conferenciaId, Nombre = "Carlos", Email = "c@test.com", PuedeGenerarCertificado = false };
        _db.Participantes.Add(p);
        await _db.SaveChangesAsync();

        var enable = await _svc.ToggleCertificadoAsync(p.Id, _conferenciaId, _userId, true);
        Assert.True(enable.Data!.PuedeGenerarCertificado);

        var disable = await _svc.ToggleCertificadoAsync(p.Id, _conferenciaId, _userId, false);
        Assert.False(disable.Data!.PuedeGenerarCertificado);
    }

    [Fact]
    public async Task Delete_Existing_RemovesRecord()
    {
        var p = new Participante { ConferenciaId = _conferenciaId, Nombre = "X", Email = "x@test.com" };
        _db.Participantes.Add(p);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(p.Id, _conferenciaId, _userId);

        Assert.True(result.Success);
        Assert.Equal(0, await _db.Participantes.CountAsync());
    }

    [Fact]
    public async Task Delete_WrongConferencia_Fails()
    {
        var p = new Participante { ConferenciaId = _conferenciaId, Nombre = "X", Email = "x@test.com" };
        _db.Participantes.Add(p);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(p.Id, Guid.NewGuid(), _userId);

        Assert.False(result.Success);
        Assert.Equal("NOT_FOUND", result.ErrorCode);
    }
}
