using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Conferencia> Conferencias => Set<Conferencia>();
    public DbSet<Sala> Salas => Set<Sala>();
    public DbSet<Expositor> Expositores => Set<Expositor>();

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

        return base.SaveChangesAsync(cancellationToken);
    }
}
