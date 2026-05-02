using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Data;

public static class SeedData
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (await context.Usuarios.AnyAsync()) return;

        var usuarioId = Guid.NewGuid();
        var conferenciaId = Guid.NewGuid();
        var sala1Id = Guid.NewGuid();
        var sala2Id = Guid.NewGuid();
        var expo1Id = Guid.NewGuid();
        var expo2Id = Guid.NewGuid();
        var expo3Id = Guid.NewGuid();

        var usuario = new Usuario
        {
            Id = usuarioId,
            Nombre = "Admin Demo",
            Email = "demo@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234"),
            EmailVerificado = true,
            Organizacion = "ConferenceManager Demo",
            CreatedAt = DateTime.UtcNow
        };

        var conferencia = new Conferencia
        {
            Id = conferenciaId,
            UsuarioId = usuarioId,
            Nombre = "ReactConf Argentina 2026",
            Slug = "reactconf",
            Descripcion = "La conferencia más importante de React en Latinoamérica. Dos días de charlas, workshops y networking.",
            FechaInicio = DateOnly.Parse("2026-06-10"),
            FechaFin = DateOnly.Parse("2026-06-11"),
            Estado = ConferenciaEstado.Publicado,
            ColorPrimario = "#3b82f6",
            ColorSecundario = "#1e293b",
            VenueNombre = "Centro Cultural Borges",
            VenueDireccion = "Viamonte 525, Buenos Aires",
            CreatedAt = DateTime.UtcNow
        };

        var salas = new[]
        {
            new Sala { Id = sala1Id, ConferenciaId = conferenciaId, Nombre = "Auditorio Principal", Capacidad = 500, CreatedAt = DateTime.UtcNow },
            new Sala { Id = sala2Id, ConferenciaId = conferenciaId, Nombre = "Sala Workshop", Capacidad = 80, CreatedAt = DateTime.UtcNow }
        };

        var expositores = new[]
        {
            new Expositor
            {
                Id = expo1Id,
                ConferenciaId = conferenciaId,
                Nombre = "María García",
                Email = "maria@reactconf.ar",
                Bio = "Core maintainer de React. 10 años de experiencia en frontend. Speaker en ReactConf US y Europe.",
                TokenAcceso = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow
            },
            new Expositor
            {
                Id = expo2Id,
                ConferenciaId = conferenciaId,
                Nombre = "Carlos Rodríguez",
                Email = "carlos@reactconf.ar",
                Bio = "Creador de varias librerías open source. Especialista en performance y bundling.",
                TokenAcceso = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow
            },
            new Expositor
            {
                Id = expo3Id,
                ConferenciaId = conferenciaId,
                Nombre = "Ana Martínez",
                Email = "ana@reactconf.ar",
                Bio = "Engineering Manager en una fintech. Experta en arquitectura frontend y React Server Components.",
                TokenAcceso = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.UtcNow
            }
        };

        var sesiones = new[]
        {
            new Sesion
            {
                Id = Guid.NewGuid(),
                ConferenciaId = conferenciaId,
                SalaId = sala1Id,
                ExpositorId = expo1Id,
                Titulo = "React 19: Novedades y React Compiler",
                Descripcion = "Un recorrido por todas las novedades de React 19, el nuevo compilador y cómo impacta en el desarrollo cotidiano.",
                Fecha = DateOnly.Parse("2026-06-10"),
                HoraInicio = TimeOnly.Parse("09:00"),
                HoraFin = TimeOnly.Parse("10:00"),
                Track = "Core",
                CreatedAt = DateTime.UtcNow
            },
            new Sesion
            {
                Id = Guid.NewGuid(),
                ConferenciaId = conferenciaId,
                SalaId = sala1Id,
                ExpositorId = expo2Id,
                Titulo = "Performance en 2026: Turbopack, Vite 6 y más",
                Descripcion = "Comparativa de bundlers modernos y estrategias para lograr tiempos de build y HMR ultra-rápidos.",
                Fecha = DateOnly.Parse("2026-06-10"),
                HoraInicio = TimeOnly.Parse("10:30"),
                HoraFin = TimeOnly.Parse("11:30"),
                Track = "Performance",
                CreatedAt = DateTime.UtcNow
            },
            new Sesion
            {
                Id = Guid.NewGuid(),
                ConferenciaId = conferenciaId,
                SalaId = sala2Id,
                ExpositorId = expo3Id,
                Titulo = "Workshop: React Server Components desde cero",
                Descripcion = "Hands-on workshop de 2 horas. Construiremos una app completa usando RSC, Server Actions y Suspense.",
                Fecha = DateOnly.Parse("2026-06-10"),
                HoraInicio = TimeOnly.Parse("14:00"),
                HoraFin = TimeOnly.Parse("16:00"),
                Track = "Workshop",
                EncuestaUrl = "https://forms.gle/example",
                CreatedAt = DateTime.UtcNow
            },
            new Sesion
            {
                Id = Guid.NewGuid(),
                ConferenciaId = conferenciaId,
                SalaId = sala1Id,
                ExpositorId = expo3Id,
                Titulo = "Arquitectura Frontend a escala: Micro-frontends con Module Federation",
                Descripcion = "Cómo estructurar aplicaciones React grandes usando micro-frontends y Module Federation 2.0.",
                Fecha = DateOnly.Parse("2026-06-11"),
                HoraInicio = TimeOnly.Parse("09:00"),
                HoraFin = TimeOnly.Parse("10:00"),
                Track = "Arquitectura",
                CreatedAt = DateTime.UtcNow
            },
            new Sesion
            {
                Id = Guid.NewGuid(),
                ConferenciaId = conferenciaId,
                SalaId = sala1Id,
                ExpositorId = expo1Id,
                Titulo = "El futuro de React: hacia dónde vamos",
                Descripcion = "Keynote de cierre. Roadmap de React para 2027 y más allá.",
                Fecha = DateOnly.Parse("2026-06-11"),
                HoraInicio = TimeOnly.Parse("17:00"),
                HoraFin = TimeOnly.Parse("18:00"),
                Track = "Keynote",
                CreatedAt = DateTime.UtcNow
            }
        };

        context.Usuarios.Add(usuario);
        context.Conferencias.Add(conferencia);
        context.Salas.AddRange(salas);
        context.Expositores.AddRange(expositores);
        context.Sesiones.AddRange(sesiones);

        await context.SaveChangesAsync();
    }
}
