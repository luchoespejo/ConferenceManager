using ConferenceManager.Application.Common.Interfaces;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace ConferenceManager.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Conferencia> Conferencias => Set<Conferencia>();
    public DbSet<Sala> Salas => Set<Sala>();
    public DbSet<Expositor> Expositores => Set<Expositor>();
    public DbSet<ExpositorCredencial> ExpositorCredenciales => Set<ExpositorCredencial>();
    public DbSet<Sesion> Sesiones => Set<Sesion>();
    public DbSet<Participante> Participantes => Set<Participante>();
    public DbSet<AvisoUrgente> AvisosUrgentes => Set<AvisoUrgente>();
    public DbSet<ImagenAlmacenada> ImagenesAlmacenadas => Set<ImagenAlmacenada>();
    public DbSet<Organizador> Organizadores => Set<Organizador>();
    public DbSet<FechaImportante> FechasImportantes => Set<FechaImportante>();
    public DbSet<EjeTematico> EjesTematicos => Set<EjeTematico>();
    public DbSet<SeccionConfig> SeccionConfigs => Set<SeccionConfig>();
    public DbSet<ConferenciaLayout> ConferenciaLayouts => Set<ConferenciaLayout>();

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        modelBuilder.HasPostgresExtension("pgcrypto");
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Usuario>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<RefreshToken>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<Conferencia>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<Sala>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<Expositor>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<Sesion>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<Participante>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<AvisoUrgente>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        foreach (var entry in ChangeTracker.Entries<ExpositorCredencial>()
            .Where(e => e.State == EntityState.Added))
        {
            if (entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
