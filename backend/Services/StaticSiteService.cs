using System.Globalization;
using System.IO.Compression;
using System.Text;
using ConferenceManager.Data;
using ConferenceManager.Models;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Services;

public class StaticSiteService(
    AppDbContext context,
    IConfiguration config,
    HttpClient httpClient,
    ILogger<StaticSiteService> logger) : IStaticSiteService
{
    private static readonly CultureInfo EsAr = new("es-AR");

    // ── Nav config — mirrors layout.tsx logic exactly ─────────────────────────

    private readonly record struct NavConfig(
        bool TieneSesiones,
        bool TieneExpositores,
        bool MostrarInscripciones,
        bool MostrarContacto
    );

    /// <summary>
    /// Builds the &lt;nav&gt; HTML for a page. prefix = "" for root pages, "../../" for s/{id}/.
    /// </summary>
    private static string BuildNav(Conferencia c, NavConfig nav, string prefix = "")
    {
        var links = new StringBuilder();
        if (nav.TieneSesiones)
            links.Append($"""<a href="{prefix}programa.html">Programa</a>""");
        if (nav.TieneExpositores)
            links.Append($"""<a href="{prefix}expositores.html">Expositores</a>""");
        if (nav.MostrarInscripciones)
            links.Append($"""<a href="{prefix}inscripciones.html" style="font-weight:700">Inscripciones</a>""");
        if (nav.MostrarContacto)
            links.Append($"""<a href="{prefix}contacto.html">Contacto</a>""");

        return $"""
            <nav class="nav">
              <a href="{prefix}index.html" class="nav-brand">Inicio</a>
              <div class="nav-links">{links}</div>
            </nav>
            """;
    }

    public async Task<StaticSiteZip?> GenerateZipAsync(Guid conferenciaId, Guid usuarioId)
    {
        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conferenciaId && c.UsuarioId == usuarioId);

        if (conferencia is null) return null;

        var expositores = await context.Expositores
            .AsNoTracking()
            .Where(e => e.ConferenciaId == conferenciaId)
            .OrderBy(e => e.Nombre)
            .ToListAsync();

        var sesiones = await context.Sesiones
            .AsNoTracking()
            .Include(s => s.Sala)
            .Include(s => s.Expositor)
            .Where(s => s.ConferenciaId == conferenciaId)
            .OrderBy(s => s.Fecha)
            .ThenBy(s => s.HoraInicio)
            .ToListAsync();

        var organizadores = await context.Organizadores
            .AsNoTracking()
            .Where(o => o.ConferenciaId == conferenciaId)
            .OrderBy(o => o.Orden)
            .ToListAsync();

        var fechasImportantes = await context.FechasImportantes
            .AsNoTracking()
            .Where(f => f.ConferenciaId == conferenciaId)
            .OrderBy(f => f.Fecha)
            .ToListAsync();

        // Compute nav flags — same logic as layout.tsx
        var hasContacto =
            conferencia.MostrarContacto ||
            !string.IsNullOrEmpty(conferencia.VenueNombre) ||
            !string.IsNullOrEmpty(conferencia.VenueDireccion) ||
            !string.IsNullOrEmpty(conferencia.EmailContacto) ||
            !string.IsNullOrEmpty(conferencia.Instagram);

        var nav = new NavConfig(
            TieneSesiones:        sesiones.Count > 0,
            TieneExpositores:     expositores.Count > 0,
            MostrarInscripciones: conferencia.MostrarInscripciones,
            MostrarContacto:      hasContacto
        );

        using var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddTextEntry(zip, "assets/style.css", GenerateCss(conferencia));

            var indexHtml = !string.IsNullOrEmpty(conferencia.LayoutJson)
                ? GeneratePuckHomeHtml(conferencia, organizadores, fechasImportantes, nav)
                : await GenerateHomeHtmlAsync(conferencia, nav);
            AddTextEntry(zip, "index.html", indexHtml);

            if (nav.TieneSesiones)
                AddTextEntry(zip, "programa.html", GenerateProgramaHtml(conferencia, sesiones, nav));

            if (nav.TieneExpositores)
                AddTextEntry(zip, "expositores.html", await GenerateExpositoresHtmlAsync(conferencia, expositores, nav));

            if (nav.MostrarContacto)
                AddTextEntry(zip, "contacto.html", GenerateContactoHtml(conferencia, nav));

            if (nav.MostrarInscripciones)
                AddTextEntry(zip, "inscripciones.html", GenerateInscripcionesHtml(conferencia, nav));

            foreach (var sesion in sesiones)
                AddTextEntry(zip, $"s/{sesion.Id}/index.html", GenerateSesionHtml(conferencia, sesion, nav));
        }

        return new StaticSiteZip(ms.ToArray(), conferencia.Slug);
    }

    private static void AddTextEntry(ZipArchive zip, string path, string content)
    {
        var entry = zip.CreateEntry(path, CompressionLevel.Optimal);
        using var writer = new StreamWriter(entry.Open(), Encoding.UTF8);
        writer.Write(content);
    }

    private static string Esc(string? s) =>
        string.IsNullOrEmpty(s) ? "" :
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");

    private static string FormatDateLong(DateOnly d) =>
        d.ToString("dddd d 'de' MMMM 'de' yyyy", EsAr);

    private async Task<string> EmbedImageAsync(string? url)
    {
        if (string.IsNullOrEmpty(url)) return "";
        try
        {
            var absoluteUrl = url.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                ? url
                : $"{config["App:BaseUrl"]}{url}";

            var bytes = await httpClient.GetByteArrayAsync(absoluteUrl);
            if (bytes.Length > 200 * 1024) return absoluteUrl;

            var lUrl = url.ToLowerInvariant();
            var mime = lUrl.Contains(".png") ? "image/png"
                : lUrl.Contains(".gif") ? "image/gif"
                : lUrl.Contains(".webp") ? "image/webp"
                : lUrl.Contains(".svg") ? "image/svg+xml"
                : "image/jpeg";

            return $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not embed image: {Url}", url);
            return url;
        }
    }

    private static string GenerateCss(Conferencia c)
    {
        var primary = string.IsNullOrEmpty(c.ColorPrimario) ? "#2563eb" : c.ColorPrimario;
        var secondary = string.IsNullOrEmpty(c.ColorSecundario) ? "#0f172a" : c.ColorSecundario;

        return $$"""
            :root {
              --primary: {{primary}};
              --secondary: {{secondary}};
              --text: #0f172a;
              --muted: #64748b;
              --bg: #f1f5f9;
              --surface: #ffffff;
              --border: #e2e8f0;
              --r: 8px;
              --shadow: 0 1px 3px rgba(0,0,0,.08);
            }
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
            a { color: var(--primary); text-decoration: none; }
            a:hover { text-decoration: underline; }
            .nav { background: var(--secondary); padding: .875rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
            .nav-brand { color: #fff; font-weight: 700; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
            .nav-brand:hover { text-decoration: none; opacity: .85; }
            .nav-links { display: flex; gap: .375rem; flex-shrink: 0; }
            .nav-links a { color: rgba(255,255,255,.8); font-size: .875rem; padding: .3rem .7rem; border-radius: 5px; transition: background .15s; }
            .nav-links a:hover { background: rgba(255,255,255,.12); text-decoration: none; color: #fff; }
            .hero { background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: #fff; padding: 3.5rem 1.5rem; text-align: center; }
            .hero-logo { max-height: 64px; max-width: 200px; display: block; margin: 0 auto 1.25rem; object-fit: contain; }
            .hero h1 { font-size: clamp(1.75rem, 5vw, 2.75rem); font-weight: 800; letter-spacing: -.025em; margin-bottom: .5rem; }
            .hero p { font-size: 1.05rem; opacity: .87; max-width: 540px; margin: .625rem auto 0; line-height: 1.65; }
            .info-bar { background: var(--surface); border-bottom: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: .375rem 1.5rem; justify-content: center; padding: .875rem 1.5rem; font-size: .875rem; color: var(--muted); }
            .info-bar strong { color: var(--text); }
            .container { max-width: 900px; margin: 0 auto; padding: 2rem 1.25rem; }
            .cta-row { display: flex; justify-content: center; gap: .75rem; flex-wrap: wrap; padding: 1.75rem 0 .5rem; }
            .btn { display: inline-flex; align-items: center; gap: .4rem; padding: .6rem 1.25rem; border-radius: 6px; font-weight: 600; font-size: .875rem; cursor: pointer; transition: opacity .15s, transform .1s; border: 2px solid transparent; }
            .btn:hover { opacity: .88; transform: translateY(-1px); text-decoration: none; }
            .btn-primary { background: var(--primary); color: #fff; }
            .btn-outline { background: transparent; color: var(--secondary); border-color: var(--secondary); }
            .section-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.25rem; padding-bottom: .5rem; border-bottom: 2px solid var(--border); }
            .day-section { margin-bottom: 2.5rem; }
            .day-heading { font-size: .875rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; margin-bottom: .875rem; }
            .session-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: .9rem 1.125rem; margin-bottom: .5rem; display: flex; gap: 1rem; align-items: flex-start; box-shadow: var(--shadow); transition: border-color .15s; }
            .session-card:hover { border-color: var(--primary); }
            .session-time { font-weight: 700; font-size: .8125rem; color: var(--primary); min-width: 88px; padding-top: .125rem; flex-shrink: 0; }
            .session-body { flex: 1; min-width: 0; }
            .session-title { font-weight: 600; font-size: .9375rem; margin-bottom: .25rem; }
            .session-title a { color: var(--text); }
            .session-title a:hover { color: var(--primary); text-decoration: none; }
            .session-meta { font-size: .8rem; color: var(--muted); }
            .track-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 1px 7px; border-radius: 4px; font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; margin-left: .4rem; vertical-align: middle; }
            .speakers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.125rem; }
            .speaker-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow); }
            .speaker-photo { width: 100%; height: 160px; object-fit: cover; display: block; background: var(--bg); }
            .speaker-photo-placeholder { width: 100%; height: 160px; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; color: rgba(255,255,255,.4); }
            .speaker-info { padding: .875rem 1rem; }
            .speaker-name { font-weight: 700; font-size: .9375rem; margin-bottom: .3rem; }
            .speaker-bio { font-size: .8125rem; color: var(--muted); line-height: 1.55; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
            .detail-wrap { max-width: 700px; }
            .detail-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--r); padding: 2rem 2.25rem; box-shadow: var(--shadow); }
            .detail-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 1rem; letter-spacing: -.02em; line-height: 1.3; }
            .meta-grid { display: flex; flex-wrap: wrap; gap: .4rem .875rem; margin-bottom: 1.5rem; font-size: .875rem; color: var(--muted); }
            .meta-item { display: flex; align-items: center; gap: .3rem; }
            .description { font-size: .9375rem; line-height: 1.7; color: var(--text); white-space: pre-line; margin-bottom: 1.5rem; }
            .qr-section { text-align: center; padding: 1.5rem 1rem; background: var(--bg); border-radius: var(--r); border: 1px dashed var(--border); }
            .qr-section img { max-width: 180px; height: auto; margin: 0 auto .625rem; display: block; }
            .qr-label { font-size: .8rem; color: var(--muted); }
            .back-link { display: inline-flex; align-items: center; gap: .35rem; font-size: .875rem; color: var(--muted); margin-bottom: 1.5rem; }
            .back-link:hover { color: var(--primary); text-decoration: none; }
            .footer { text-align: center; padding: 2.5rem 1rem 2rem; color: var(--muted); font-size: .8125rem; border-top: 1px solid var(--border); margin-top: 3rem; }
            @media (max-width: 600px) {
              .session-card { flex-direction: column; gap: .3rem; }
              .session-time { min-width: auto; }
              .detail-card { padding: 1.25rem; }
              .hero { padding: 2.5rem 1rem; }
            }
            """;
    }

    private string GeneratePuckHomeHtml(
        Conferencia c,
        List<Organizador> organizadores,
        List<FechaImportante> fechasImportantes,
        NavConfig nav)
    {
        var mainContent = PuckHtmlRenderer.RenderMainContent(c.LayoutJson!, c, organizadores, fechasImportantes);
        var navHtml = BuildNav(c, nav);

        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
              <style>
                .puck-richtext p { margin: .5em 0; }
                .puck-richtext ul, .puck-richtext ol { padding-left: 1.5em; margin: .5em 0; }
                .puck-richtext a { color: var(--primary); }
                .puck-richtext blockquote { border-left: 3px solid #e5e7eb; margin: 0; padding-left: 1rem; color: #64748b; }
                .puck-richtext pre { background: #f1f5f9; padding: 1rem; border-radius: 6px; overflow-x: auto; }
              </style>
            </head>
            <body>
              {{navHtml}}
              <main>{{mainContent}}</main>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private async Task<string> GenerateHomeHtmlAsync(Conferencia c, NavConfig nav)
    {
        var logoHtml = "";
        if (!string.IsNullOrEmpty(c.LogoUrl))
        {
            var src = await EmbedImageAsync(c.LogoUrl);
            if (!string.IsNullOrEmpty(src))
                logoHtml = $"""<img src="{Esc(src)}" alt="Logo" class="hero-logo" />""";
        }

        var descHtml = !string.IsNullOrEmpty(c.Descripcion)
            ? $"<p>{Esc(c.Descripcion)}</p>"
            : "";

        var venueHtml = !string.IsNullOrEmpty(c.VenueNombre)
            ? $"<span>📍 <strong>{Esc(c.VenueNombre)}</strong>{(!string.IsNullOrEmpty(c.VenueDireccion) ? $" — {Esc(c.VenueDireccion)}" : "")}</span>"
            : "";

        var mapsHtml = !string.IsNullOrEmpty(c.VenueLinkMaps)
            ? $"""<span><a href="{Esc(c.VenueLinkMaps)}" target="_blank" rel="noopener">📌 Ver en mapa</a></span>"""
            : "";

        var ctaHtml = new StringBuilder();
        if (nav.TieneSesiones)
            ctaHtml.Append("""<a href="programa.html" class="btn btn-primary">📋 Ver Programa</a>""");
        if (nav.TieneExpositores)
            ctaHtml.Append("""<a href="expositores.html" class="btn btn-outline">🎤 Ver Expositores</a>""");

        var navHtml = BuildNav(c, nav);

        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="hero">
                {{logoHtml}}
                <h1>{{Esc(c.Nombre)}}</h1>
                {{descHtml}}
              </div>
              <div class="info-bar">
                <span>📅 <strong>{{FormatDateLong(c.FechaInicio)}}</strong> — <strong>{{FormatDateLong(c.FechaFin)}}</strong></span>
                {{venueHtml}}
                {{mapsHtml}}
              </div>
              <div class="container">
                <div class="cta-row">{{ctaHtml}}</div>
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private string GenerateProgramaHtml(Conferencia c, List<Sesion> sesiones, NavConfig nav)
    {
        string content;
        if (sesiones.Count == 0)
        {
            content = "<p style=\"color:var(--muted)\">No hay sesiones registradas.</p>";
        }
        else
        {
            var sb = new StringBuilder();
            foreach (var day in sesiones.GroupBy(s => s.Fecha).OrderBy(g => g.Key))
            {
                sb.AppendLine($"""<div class="day-section">""");
                sb.AppendLine($"""  <div class="day-heading">{Esc(FormatDateLong(day.Key))}</div>""");

                foreach (var s in day.OrderBy(s => s.HoraInicio))
                {
                    var trackBadge = s.Track is not null
                        ? $"""<span class="track-badge">{Esc(s.Track)}</span>"""
                        : "";
                    sb.AppendLine($"""
                      <div class="session-card">
                        <div class="session-time">{s.HoraInicio.ToString("HH:mm")} – {s.HoraFin.ToString("HH:mm")}</div>
                        <div class="session-body">
                          <div class="session-title">
                            <a href="s/{s.Id}/index.html">{Esc(s.Titulo)}</a>{trackBadge}
                          </div>
                          <div class="session-meta">📍 {Esc(s.Sala?.Nombre)} &nbsp;·&nbsp; 🎤 {Esc(s.Expositor?.Nombre)}</div>
                        </div>
                      </div>
                    """);
                }

                sb.AppendLine("</div>");
            }
            content = sb.ToString();
        }

        var navHtml = BuildNav(c, nav);
        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Programa — {{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="container">
                <h2 class="section-title">Programa del Evento</h2>
                {{content}}
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private async Task<string> GenerateExpositoresHtmlAsync(Conferencia c, List<Expositor> expositores, NavConfig nav)
    {
        string content;
        if (expositores.Count == 0)
        {
            content = "<p style=\"color:var(--muted)\">No hay expositores registrados.</p>";
        }
        else
        {
            var sb = new StringBuilder();
            sb.AppendLine("""<div class="speakers-grid">""");

            foreach (var e in expositores)
            {
                string photoHtml;
                if (!string.IsNullOrEmpty(e.FotoUrl))
                {
                    var src = await EmbedImageAsync(e.FotoUrl);
                    photoHtml = string.IsNullOrEmpty(src)
                        ? """<div class="speaker-photo-placeholder">🎤</div>"""
                        : $"""<img src="{Esc(src)}" alt="{Esc(e.Nombre)}" class="speaker-photo" />""";
                }
                else
                {
                    photoHtml = """<div class="speaker-photo-placeholder">🎤</div>""";
                }

                var bioHtml = !string.IsNullOrEmpty(e.Bio)
                    ? $"""<p class="speaker-bio">{Esc(e.Bio)}</p>"""
                    : "";

                sb.AppendLine($"""
                  <div class="speaker-card">
                    {photoHtml}
                    <div class="speaker-info">
                      <div class="speaker-name">{Esc(e.Nombre)}</div>
                      {bioHtml}
                    </div>
                  </div>
                """);
            }

            sb.AppendLine("</div>");
            content = sb.ToString();
        }

        var navHtml = BuildNav(c, nav);
        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Expositores — {{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="container">
                <h2 class="section-title">Expositores</h2>
                {{content}}
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private static string GenerateContactoHtml(Conferencia c, NavConfig nav)
    {
        var sb = new StringBuilder();

        if (!string.IsNullOrEmpty(c.VenueNombre) || !string.IsNullOrEmpty(c.VenueDireccion))
        {
            sb.AppendLine("""<section style="margin-bottom:2.5rem">""");
            sb.AppendLine("""  <h2 class="section-title">Ubicación</h2>""");
            if (!string.IsNullOrEmpty(c.VenueNombre))
                sb.AppendLine($"""  <p style="font-size:1.05rem;font-weight:600;color:#1e293b;margin-bottom:.35rem">{Esc(c.VenueNombre)}</p>""");
            if (!string.IsNullOrEmpty(c.VenueDireccion))
                sb.AppendLine($"""  <p style="font-size:.95rem;color:#475569;margin-bottom:.75rem">📍 {Esc(c.VenueDireccion)}</p>""");
            if (!string.IsNullOrEmpty(c.VenueLinkMaps))
                sb.AppendLine($"""  <a href="{Esc(c.VenueLinkMaps)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:.4rem;background:var(--primary);color:#fff;font-weight:600;padding:8px 18px;border-radius:8px;text-decoration:none;font-size:.9rem;margin-bottom:1.25rem">🗺 Abrir en Google Maps</a>""");
            sb.AppendLine("</section>");
        }

        var hasContactInfo = !string.IsNullOrEmpty(c.EmailContacto) || !string.IsNullOrEmpty(c.Instagram) ||
                             !string.IsNullOrEmpty(c.FormularioInscripcionUrl) || !string.IsNullOrEmpty(c.ContactoAdicional);
        if (hasContactInfo)
        {
            sb.AppendLine("""<section>""");
            sb.AppendLine("""  <h2 class="section-title">Contacto e Informes</h2>""");
            sb.AppendLine("""  <div style="display:flex;flex-direction:column;gap:.75rem">""");
            if (!string.IsNullOrEmpty(c.EmailContacto))
                sb.AppendLine($"""    <a href="mailto:{Esc(c.EmailContacto)}" style="display:inline-flex;align-items:center;gap:.5rem;color:var(--primary);font-weight:600;font-size:1rem">✉ {Esc(c.EmailContacto)}</a>""");
            if (!string.IsNullOrEmpty(c.Instagram))
                sb.AppendLine($"""    <a href="https://instagram.com/{Esc(c.Instagram)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:.5rem;color:var(--primary);font-weight:600;font-size:1rem">📷 @{Esc(c.Instagram)}</a>""");
            if (!string.IsNullOrEmpty(c.FormularioInscripcionUrl))
                sb.AppendLine($"""    <a href="{Esc(c.FormularioInscripcionUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:.5rem;color:var(--primary);font-weight:600;font-size:1rem">📝 Formulario de inscripción</a>""");
            if (!string.IsNullOrEmpty(c.ContactoAdicional))
                sb.AppendLine($"""    <p style="font-size:.95rem;color:#475569;white-space:pre-line;margin-top:.5rem">{Esc(c.ContactoAdicional)}</p>""");
            sb.AppendLine("  </div>");
            sb.AppendLine("</section>");
        }

        var navHtml = BuildNav(c, nav);
        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Contacto — {{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="container" style="max-width:760px">
                {{sb}}
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private static string GenerateInscripcionesHtml(Conferencia c, NavConfig nav)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrEmpty(c.ArancelesTexto))
            sb.AppendLine($"""<p style="color:#374151;white-space:pre-line;margin-bottom:1.5rem;font-size:.9375rem;line-height:1.7">{Esc(c.ArancelesTexto)}</p>""");
        if (!string.IsNullOrEmpty(c.FormularioInscripcionUrl))
            sb.AppendLine($"""<a href="{Esc(c.FormularioInscripcionUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">📝 Formulario de inscripción</a>""");
        if (!string.IsNullOrEmpty(c.InformacionPago))
            sb.AppendLine($"""<div style="margin-top:1.5rem;padding:1.25rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><h3 style="font-size:1rem;font-weight:600;margin-bottom:.5rem">Información de pago</h3><p style="font-size:.9rem;color:#475569;white-space:pre-line">{Esc(c.InformacionPago)}</p></div>""");

        var navHtml = BuildNav(c, nav);
        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>Inscripciones — {{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="container" style="max-width:700px">
                <h2 class="section-title">Inscripciones</h2>
                {{sb}}
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }

    private static string GenerateSesionHtml(Conferencia c, Sesion s, NavConfig nav)
    {
        var qrHtml = !string.IsNullOrEmpty(s.QrCodeUrl)
            ? $"""
              <div class="qr-section">
                <img src="{Esc(s.QrCodeUrl)}" alt="QR de la sesión" />
                <p class="qr-label">Escaneá para acceder a esta sesión online</p>
              </div>
              """
            : "";

        var trackBadge = s.Track is not null
            ? $"""<span class="track-badge">{Esc(s.Track)}</span>"""
            : "";

        var descHtml = !string.IsNullOrEmpty(s.Descripcion)
            ? $"""<div class="description">{Esc(s.Descripcion)}</div>"""
            : "";

        var encuestaHtml = !string.IsNullOrEmpty(s.EncuestaUrl)
            ? $"""<div style="margin-top:1.5rem"><a href="{Esc(s.EncuestaUrl)}" target="_blank" rel="noopener" class="btn btn-primary">📝 Completar encuesta</a></div>"""
            : "";

        var navHtml = BuildNav(c, nav, "../../");
        return $$"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>{{Esc(s.Titulo)}} — {{Esc(c.Nombre)}}</title>
              <link rel="stylesheet" href="../../assets/style.css" />
            </head>
            <body>
              {{navHtml}}
              <div class="container">
                <a href="../../programa.html" class="back-link">← Volver al programa</a>
                <div class="detail-wrap">
                  <div class="detail-card">
                    <div class="detail-title">{{Esc(s.Titulo)}} {{trackBadge}}</div>
                    <div class="meta-grid">
                      <span class="meta-item">📅 {{FormatDateLong(s.Fecha)}}</span>
                      <span class="meta-item">⏰ {{s.HoraInicio.ToString("HH:mm")}} – {{s.HoraFin.ToString("HH:mm")}}</span>
                      <span class="meta-item">📍 {{Esc(s.Sala?.Nombre)}}</span>
                      <span class="meta-item">🎤 {{Esc(s.Expositor?.Nombre)}}</span>
                    </div>
                    {{descHtml}}
                    {{qrHtml}}
                    {{encuestaHtml}}
                  </div>
                </div>
              </div>
              <footer class="footer">{{Esc(c.Nombre)}}</footer>
            </body>
            </html>
            """;
    }
}
