using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Application.Common.Interfaces;

/// <summary>
/// Abstraction over the EF Core context, owned by the Application layer so handlers
/// depend on this contract instead of the concrete <c>AppDbContext</c> (Infrastructure).
/// </summary>
public interface IAppDbContext
{
    DbSet<Usuario> Usuarios { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<Conferencia> Conferencias { get; }
    DbSet<Sala> Salas { get; }
    DbSet<Expositor> Expositores { get; }
    DbSet<ExpositorCredencial> ExpositorCredenciales { get; }
    DbSet<Sesion> Sesiones { get; }
    DbSet<Participante> Participantes { get; }
    DbSet<AvisoUrgente> AvisosUrgentes { get; }
    DbSet<ImagenAlmacenada> ImagenesAlmacenadas { get; }
    DbSet<Organizador> Organizadores { get; }
    DbSet<FechaImportante> FechasImportantes { get; }
    DbSet<EjeTematico> EjesTematicos { get; }
    DbSet<SeccionConfig> SeccionConfigs { get; }
    DbSet<ConferenciaLayout> ConferenciaLayouts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
