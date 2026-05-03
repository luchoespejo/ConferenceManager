using ConferenceManager.Data;
using ConferenceManager.DTOs.Conferencias;
using ConferenceManager.Models;
using ConferenceManager.Services;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Tests;

public class ConferenciaServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly ConferenciaService _svc;
    private readonly Guid _userId = Guid.NewGuid();
    private readonly Guid _otherUserId = Guid.NewGuid();

    private static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.Today);
    private static readonly DateOnly TodayPlus2 = DateOnly.FromDateTime(DateTime.Today.AddDays(2));

    public ConferenciaServiceTests()
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(opts);
        _svc = new ConferenciaService(_db);

        // Seed a Usuario so FK is satisfied for owned conferencias
        _db.Usuarios.Add(new Usuario
        {
            Id = _userId,
            Nombre = "Test User",
            Email = "test@test.com",
            PasswordHash = "hash",
            EmailVerificado = true
        });
        _db.SaveChanges();
    }

    public void Dispose() => _db.Dispose();

    // ──────────────────────────────────────────────
    // CreateAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Create_ValidData_ReturnsSuccessWithBorradorEstado()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Mi Congreso",
            Slug = "mi-congreso",
            FechaInicio = Today,
            FechaFin = TodayPlus2
        };

        var result = await _svc.CreateAsync(dto, _userId);

        Assert.True(result.Success);
        Assert.NotNull(result.Data);
        Assert.Equal("Borrador", result.Data!.Estado);
        Assert.Equal("mi-congreso", result.Data.Slug);
    }

    [Fact]
    public async Task Create_WithBrandingFields_PersistsThem()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Congreso Branding",
            Slug = "congreso-branding",
            FechaInicio = Today,
            FechaFin = TodayPlus2,
            LogoUrl = "https://cdn.example.com/logo.png",
            LogoSecundarioUrl = "https://cdn.example.com/logo2.png",
            BannerUrl = "https://cdn.example.com/banner.jpg",
            FaviconUrl = "https://cdn.example.com/favicon.ico"
        };

        var result = await _svc.CreateAsync(dto, _userId);

        Assert.True(result.Success);
        Assert.Equal("https://cdn.example.com/logo.png", result.Data!.LogoUrl);
        Assert.Equal("https://cdn.example.com/logo2.png", result.Data.LogoSecundarioUrl);
        Assert.Equal("https://cdn.example.com/banner.jpg", result.Data.BannerUrl);
        Assert.Equal("https://cdn.example.com/favicon.ico", result.Data.FaviconUrl);
    }

    [Fact]
    public async Task Create_DuplicateSlug_FailsWithSlugAlreadyExists()
    {
        var existing = BuildConferencia("slug-dup", _userId);
        _db.Conferencias.Add(existing);
        await _db.SaveChangesAsync();

        var dto = new CreateConferenciaDto
        {
            Nombre = "Otro",
            Slug = "slug-dup",
            FechaInicio = Today,
            FechaFin = TodayPlus2
        };

        var result = await _svc.CreateAsync(dto, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.SlugAlreadyExists, result.ErrorCode);
    }

    [Fact]
    public async Task Create_FechaInicioAfterFechaFin_Fails()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Bad Dates",
            Slug = "bad-dates",
            FechaInicio = TodayPlus2,
            FechaFin = Today
        };

        var result = await _svc.CreateAsync(dto, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.FechaInicioAfterFechaFin, result.ErrorCode);
    }

    [Fact]
    public async Task Create_InvalidSlugFormat_Fails()
    {
        var dto = new CreateConferenciaDto
        {
            Nombre = "Invalid Slug",
            Slug = "INVALID SLUG!",
            FechaInicio = Today,
            FechaFin = TodayPlus2
        };

        var result = await _svc.CreateAsync(dto, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.SlugInvalidFormat, result.ErrorCode);
    }

    // ──────────────────────────────────────────────
    // UpdateAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Update_ValidData_UpdatesBrandingFields()
    {
        var conferencia = BuildConferencia("update-branding", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var dto = new UpdateConferenciaDto
        {
            LogoUrl = "https://new.example.com/logo.png",
            BannerUrl = "https://new.example.com/banner.jpg"
        };

        var result = await _svc.UpdateAsync(conferencia.Id, dto, _userId);

        Assert.True(result.Success);
        Assert.Equal("https://new.example.com/logo.png", result.Data!.LogoUrl);
        Assert.Equal("https://new.example.com/banner.jpg", result.Data.BannerUrl);
    }

    [Fact]
    public async Task Update_WrongOwner_Fails()
    {
        var conferencia = BuildConferencia("wrong-owner-upd", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var dto = new UpdateConferenciaDto { Nombre = "Renamed" };

        var result = await _svc.UpdateAsync(conferencia.Id, dto, _otherUserId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.ConferenciaNotFound, result.ErrorCode);
    }

    [Fact]
    public async Task Update_SlugOnPublished_Fails()
    {
        var conferencia = BuildConferencia("slug-published", _userId, ConferenciaEstado.Publicado);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var dto = new UpdateConferenciaDto { Slug = "new-slug" };

        var result = await _svc.UpdateAsync(conferencia.Id, dto, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.CannotChangeSlugNonDraft, result.ErrorCode);
    }

    // ──────────────────────────────────────────────
    // DeleteAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Delete_BorradorConferencia_Succeeds()
    {
        var conferencia = BuildConferencia("to-delete", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(conferencia.Id, _userId);

        Assert.True(result.Success);
        Assert.False(await _db.Conferencias.AnyAsync(c => c.Id == conferencia.Id));
    }

    [Fact]
    public async Task Delete_PublicadoConferencia_Fails()
    {
        var conferencia = BuildConferencia("no-delete-pub", _userId, ConferenciaEstado.Publicado);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.DeleteAsync(conferencia.Id, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.CannotDeleteNonDraft, result.ErrorCode);
    }

    // ──────────────────────────────────────────────
    // PublicarAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Publicar_FromBorrador_SetsEstadoPublicado()
    {
        var conferencia = BuildConferencia("to-publish", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.PublicarAsync(conferencia.Id, _userId);

        Assert.True(result.Success);
        Assert.Equal("Publicado", result.Data!.Estado);
    }

    [Fact]
    public async Task Publicar_AlreadyPublicado_Fails()
    {
        var conferencia = BuildConferencia("already-pub", _userId, ConferenciaEstado.Publicado);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.PublicarAsync(conferencia.Id, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.CannotPublishNotDraft, result.ErrorCode);
    }

    // ──────────────────────────────────────────────
    // FinalizarAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task Finalizar_FromPublicado_SetsEstadoFinalizado()
    {
        var conferencia = BuildConferencia("to-finalize", _userId, ConferenciaEstado.Publicado);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.FinalizarAsync(conferencia.Id, _userId);

        Assert.True(result.Success);
        Assert.Equal("Finalizado", result.Data!.Estado);
    }

    [Fact]
    public async Task Finalizar_FromBorrador_Fails()
    {
        var conferencia = BuildConferencia("finalizar-borrador", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.FinalizarAsync(conferencia.Id, _userId);

        Assert.False(result.Success);
        Assert.Equal(ConferenciaErrorCodes.CannotFinalizeNotPublished, result.ErrorCode);
    }

    // ──────────────────────────────────────────────
    // GetOverviewAsync
    // ──────────────────────────────────────────────

    [Fact]
    public async Task GetOverview_ExistingConferencia_ReturnsCounts()
    {
        var conferencia = BuildConferencia("overview-test", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.GetOverviewAsync(conferencia.Id, _userId);

        Assert.NotNull(result);
        Assert.Equal(conferencia.Id, result!.Id);
        Assert.Equal(0, result.TotalSesiones);
        Assert.Equal(0, result.TotalExpositores);
        Assert.Equal(0, result.TotalSalas);
        Assert.Equal(0, result.TotalParticipantes);
    }

    [Fact]
    public async Task GetOverview_WrongOwner_ReturnsNull()
    {
        var conferencia = BuildConferencia("overview-wrong-owner", _userId);
        _db.Conferencias.Add(conferencia);
        await _db.SaveChangesAsync();

        var result = await _svc.GetOverviewAsync(conferencia.Id, _otherUserId);

        Assert.Null(result);
    }

    // ──────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────

    private static Conferencia BuildConferencia(
        string slug,
        Guid userId,
        ConferenciaEstado estado = ConferenciaEstado.Borrador) =>
        new()
        {
            Id = Guid.NewGuid(),
            UsuarioId = userId,
            Nombre = $"Congreso {slug}",
            Slug = slug,
            FechaInicio = Today,
            FechaFin = TodayPlus2,
            Estado = estado,
            Usuario = null!
        };
}
