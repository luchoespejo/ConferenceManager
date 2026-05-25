using ConferenceManager.Application.Expositores.Commands;
using ConferenceManager.Application.Expositores.Queries;
using ConferenceManager.Data;
using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Tests;

// Tests the migrated Expositores slice (Clean Architecture handlers, MediatR + ErrorOr).
public class ExpositorServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();
    private readonly Guid _conferenciaId = Guid.NewGuid();

    public ExpositorServiceTests()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(opts);

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

        var result = await new CreateExpositorCommandHandler(_db)
            .Handle(new CreateExpositorCommand(_conferenciaId, _userId, dto), default);

        Assert.False(result.IsError);
        Assert.NotNull(result.Value.TokenAcceso);
        Assert.NotEmpty(result.Value.TokenAcceso);
        Assert.Equal("Dr. Smith", result.Value.Nombre);
    }

    [Fact]
    public async Task Create_WrongOwner_Fails()
    {
        var dto = new CreateExpositorDto { Nombre = "X" };

        var result = await new CreateExpositorCommandHandler(_db)
            .Handle(new CreateExpositorCommand(_conferenciaId, _otherUserId, dto), default);

        Assert.True(result.IsError);
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

        var result = await new GetExpositoresQueryHandler(_db)
            .Handle(new GetExpositoresQuery(_conferenciaId, _userId), default);

        Assert.False(result.IsError);
        Assert.Equal("my-token-123", result.Value.First().TokenAcceso);
    }

    [Fact]
    public async Task GetById_NotFound_ReturnsError()
    {
        var result = await new GetExpositorByIdQueryHandler(_db)
            .Handle(new GetExpositorByIdQuery(Guid.NewGuid(), _conferenciaId, _userId), default);

        Assert.True(result.IsError);
        Assert.Equal("EXPOSITOR_NOT_FOUND", result.FirstError.Code);
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
        var result = await new UpdateExpositorCommandHandler(_db)
            .Handle(new UpdateExpositorCommand(expositor.Id, _conferenciaId, _userId, dto), default);

        Assert.False(result.IsError);
        Assert.Equal("Actualizado", result.Value.Nombre);
        Assert.Equal("orig@test.com", result.Value.Email);
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

        var result = await new DeleteExpositorCommandHandler(_db)
            .Handle(new DeleteExpositorCommand(expositor.Id, _conferenciaId, _userId), default);

        Assert.False(result.IsError);
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

        var result = await new DeleteExpositorCommandHandler(_db)
            .Handle(new DeleteExpositorCommand(expositor.Id, _conferenciaId, _userId), default);

        Assert.True(result.IsError);
        Assert.Equal("CANNOT_DELETE_WITH_SESSIONS", result.FirstError.Code);
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

        var result = await new GetExpositorByIdQueryHandler(_db)
            .Handle(new GetExpositorByIdQuery(expositor.Id, _conferenciaId, _userId), default);

        Assert.False(result.IsError);
        Assert.Null(result.Value.RedesSociales);
    }
}
