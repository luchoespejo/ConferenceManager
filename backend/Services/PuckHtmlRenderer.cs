using System.Globalization;
using System.Text;
using System.Text.Json;
using ConferenceManager.Models;

namespace ConferenceManager.Services;

/// <summary>
/// Renders Puck v0.21 JSON (as stored in ConferenciaLayout.LayoutJson / Conferencia.LayoutJson)
/// to a static HTML string.  Used by StaticSiteService to build index.html for the
/// conference-sites repo (Instancia B — fully independent of backend at runtime).
///
/// Expected JSON shape:
/// {
///   "version": 1,
///   "puckData": {
///     "root": { "props": { "fontFamily": "..." } },
///     "content": [ { "type": "Hero", "props": { ... }, "id": "Hero-abc" } ],
///     "zones": { "SeccionFondo-abc:content": [ { "type": "Heading", ... } ] }
///   }
/// }
/// </summary>
public static class PuckHtmlRenderer
{
    private static readonly CultureInfo EsAr = new("es-AR");

    private readonly record struct RenderContext(
        Conferencia Conf,
        List<Organizador> Organizadores,
        List<FechaImportante> FechasImportantes,
        Dictionary<string, List<JsonElement>> Zones
    );

    // Google Fonts recognised by puck-config.tsx
    private static readonly string[] GoogleFonts =
    [
        "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
        "Raleway", "Poppins", "Merriweather", "Playfair Display", "Source Sans 3"
    ];

    // ── Public entry point ────────────────────────────────────────────────────

    /// <summary>
    /// Returns the HTML that goes inside &lt;main&gt; (no nav, no footer).
    /// Also prepends any required Google Fonts &lt;link&gt; tags.
    /// Returns an error comment on failure so the caller can fall back gracefully.
    /// </summary>
    public static string RenderMainContent(
        string layoutJson,
        Conferencia conf,
        List<Organizador> organizadores,
        List<FechaImportante> fechasImportantes)
    {
        try
        {
            using var doc = JsonDocument.Parse(layoutJson);
            var root = doc.RootElement;

            // Support { version, puckData } or raw puck data at root
            var puckData = root.TryGetProperty("puckData", out var pd) ? pd : root;

            // Parse zones dict  key = "{itemId}:{zoneName}"
            var zones = new Dictionary<string, List<JsonElement>>(StringComparer.Ordinal);
            if (puckData.TryGetProperty("zones", out var zonesEl))
            {
                foreach (var zone in zonesEl.EnumerateObject())
                {
                    zones[zone.Name] = zone.Value.EnumerateArray().ToList();
                }
            }

            var ctx = new RenderContext(conf, organizadores, fechasImportantes, zones);

            var sb = new StringBuilder();

            // Root font family → Google Fonts link + wrapper div
            var fontFamily = "";
            if (puckData.TryGetProperty("root", out var rootEl) &&
                rootEl.TryGetProperty("props", out var rootProps) &&
                rootProps.TryGetProperty("fontFamily", out var ffEl))
            {
                fontFamily = ffEl.GetString() ?? "";
            }

            AppendGoogleFontLink(sb, fontFamily);

            var fontStyle = !string.IsNullOrEmpty(fontFamily)
                ? $" style=\"font-family:{Esc(fontFamily)}\""
                : "";
            sb.AppendLine($"<div{fontStyle}>");

            if (puckData.TryGetProperty("content", out var contentEl))
            {
                foreach (var item in contentEl.EnumerateArray())
                    sb.Append(RenderBlock(item, ctx));
            }

            sb.AppendLine("</div>");
            return sb.ToString();
        }
        catch (Exception ex)
        {
            return $"<!-- PuckHtmlRenderer error: {Esc(ex.Message)} -->\n";
        }
    }

    // ── Block dispatcher ──────────────────────────────────────────────────────

    private static string RenderBlock(JsonElement item, RenderContext ctx)
    {
        if (!item.TryGetProperty("type", out var typeEl)) return "";
        var type = typeEl.GetString() ?? "";

        var props = item.TryGetProperty("props", out var p) ? p : default;

        // Zone routing uses the item's top-level "id"; fall back to props.id
        var id = item.TryGetProperty("id", out var idEl)
            ? idEl.GetString() ?? ""
            : (props.ValueKind != JsonValueKind.Undefined &&
               props.TryGetProperty("id", out var pid) ? pid.GetString() ?? "" : "");

        return type switch
        {
            "Hero"              => RenderHero(props),
            "Heading"           => RenderHeading(props),
            "Parrafo"           => RenderParrafo(props),
            "Imagen"            => RenderImagen(props),
            "Video"             => RenderVideo(props),
            "Boton"             => RenderBoton(props),
            "BandaColor"        => RenderBandaColor(props),
            "Separador"         => RenderSeparador(props),
            "Stats"             => RenderStats(props),
            "GaleriaLogos"      => RenderGaleriaLogos(props),
            "CuentaRegresiva"   => RenderCuentaRegresiva(props),
            "Mapa"              => RenderMapa(props),
            "SeccionFondo"      => RenderSeccionFondo(props, id, ctx),
            "DosColumnas"       => RenderDosColumnas(props, id, ctx),
            "TresColumnas"      => RenderTresColumnas(props, id, ctx),
            "FechasImportantes" => RenderFechasImportantes(ctx),
            "Organizadores"     => RenderOrganizadores(ctx),
            "Contacto"          => RenderContacto(ctx),
            "Inscripciones"     => RenderInscripciones(ctx),
            "Agenda"            => RenderAgenda(),
            "Expositores"       => RenderExpositores(),
            _                   => ""
        };
    }

    private static string RenderZone(string itemId, string zoneName, RenderContext ctx)
    {
        var key = $"{itemId}:{zoneName}";
        if (!ctx.Zones.TryGetValue(key, out var items)) return "";
        var sb = new StringBuilder();
        foreach (var item in items)
            sb.Append(RenderBlock(item, ctx));
        return sb.ToString();
    }

    // ── HERO ──────────────────────────────────────────────────────────────────

    private static string RenderHero(JsonElement p)
    {
        var titulo      = Str(p, "titulo");
        var subtitulo   = Str(p, "subtitulo");
        var lema        = Str(p, "lema");
        var color       = Str(p, "color", "#1e3a5f");
        var logoUrl     = Str(p, "logoUrl");
        var bannerUrl   = Str(p, "bannerUrl");
        var fechaInicio = Str(p, "fechaInicio");
        var fechaFin    = Str(p, "fechaFin");
        var lugar       = Str(p, "lugar");

        var bgStyle = !string.IsNullOrEmpty(bannerUrl)
            ? $"linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.55)), url({Esc(bannerUrl)}) center/cover no-repeat"
            : $"linear-gradient(135deg, {Esc(color)} 0%, #0f172a 100%)";

        var sb = new StringBuilder();
        sb.AppendLine($"""
            <section style="background:{bgStyle};min-height:65vh;display:flex;align-items:center;justify-content:center;padding:5rem 2rem;text-align:center;color:#fff">
              <div style="max-width:800px;margin:0 auto">
            """);

        if (!string.IsNullOrEmpty(logoUrl))
            sb.AppendLine($"""    <img src="{Esc(logoUrl)}" alt="logo" style="max-height:80px;margin:0 auto 1.5rem;display:block;max-width:280px;object-fit:contain" />""");

        sb.AppendLine($"""    <h1 style="font-size:2.75rem;margin:0 0 1rem;font-weight:900;line-height:1.15">{Esc(titulo)}</h1>""");

        if (!string.IsNullOrEmpty(subtitulo))
            sb.AppendLine($"""    <p style="font-size:1.25rem;opacity:.9;margin:0 0 .5rem">{Esc(subtitulo)}</p>""");

        if (!string.IsNullOrEmpty(lema))
            sb.AppendLine($"""    <p style="font-style:italic;opacity:.75;margin:0 0 1.5rem">{Esc(lema)}</p>""");

        if (!string.IsNullOrEmpty(fechaInicio) || !string.IsNullOrEmpty(lugar))
        {
            sb.AppendLine("""    <div style="display:flex;gap:1.5rem;justify-content:center;flex-wrap:wrap;margin-top:1.5rem">""");
            if (!string.IsNullOrEmpty(fechaInicio))
            {
                var fechaStr = Esc(fechaInicio) + (!string.IsNullOrEmpty(fechaFin) ? $" – {Esc(fechaFin)}" : "");
                sb.AppendLine($"""      <span style="opacity:.9;font-size:.95rem">📅 {fechaStr}</span>""");
            }
            if (!string.IsNullOrEmpty(lugar))
                sb.AppendLine($"""      <span style="opacity:.9;font-size:.95rem">📍 {Esc(lugar)}</span>""");
            sb.AppendLine("    </div>");
        }

        sb.AppendLine("  </div>");
        sb.AppendLine("</section>");
        return sb.ToString();
    }

    // ── HEADING ───────────────────────────────────────────────────────────────

    private static string RenderHeading(JsonElement p)
    {
        var texto      = Str(p, "texto", "Título");
        var nivel      = Str(p, "nivel", "h2");
        var alignment  = Str(p, "alignment", "left");
        var negrita    = Str(p, "negrita", "si");
        var cursiva    = Str(p, "cursiva", "no");
        var subrayado  = Str(p, "subrayado", "no");
        var fontFamily = Str(p, "fontFamily");
        var color      = Str(p, "color", "#111827");
        var bgColor    = Str(p, "bgColor", "transparent");
        var fontSize   = Num(p, "fontSize");
        var paddingV   = Num(p, "paddingV", 16);
        var paddingH   = Num(p, "paddingH", 32);

        var tag = nivel is "h1" or "h2" or "h3" or "h4" ? nivel : "h2";
        var levelDefaults = new Dictionary<string, string>
        {
            ["h1"] = "fs-4xl", ["h2"] = "fs-3xl", ["h3"] = "fs-2xl", ["h4"] = "fs-xl"
        };
        var fsClass = FontSizeClass(p, levelDefaults.GetValueOrDefault(tag, "fs-2xl"));

        var tagStyle =
            $"margin:0;text-align:{Esc(alignment)};color:{Esc(color)};" +
            $"font-weight:{(negrita == "si" ? "700" : "400")};" +
            $"font-style:{(cursiva == "si" ? "italic" : "normal")};" +
            $"text-decoration:{(subrayado == "si" ? "underline" : "none")};" +
            (!string.IsNullOrEmpty(fontFamily) ? $"font-family:{Esc(fontFamily)};" : "") +
            "line-height:1.25";

        var wrapStyle = $"background:{Esc(bgColor)};padding:{RemVal(paddingV)} {RemVal(paddingH)}";

        var sb = new StringBuilder();
        AppendGoogleFontLink(sb, fontFamily);
        sb.AppendLine($"<div style=\"{wrapStyle}\">");
        sb.AppendLine($"  <{tag} class=\"{fsClass}\" style=\"{tagStyle}\">{Esc(texto)}</{tag}>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    // ── PÁRRAFO ───────────────────────────────────────────────────────────────

    private static string RenderParrafo(JsonElement p)
    {
        var color    = Str(p, "color", "#374151");
        var bgColor  = Str(p, "bgColor", "transparent");
        var maxWidth = Num(p, "maxWidth");
        var paddingV = Num(p, "paddingV", 8);
        var paddingH = Num(p, "paddingH", 32);
        var fsClass  = FontSizeClass(p, "fs-base");

        var contenidoHtml = "";
        if (p.ValueKind != JsonValueKind.Undefined && p.TryGetProperty("contenido", out var contenidoEl))
        {
            contenidoHtml = TipTapHtmlConverter.ToHtml(contenidoEl);
        }

        var wrapStyle  = $"background:{Esc(bgColor)};padding:{RemVal(paddingV)} {RemVal(paddingH)}";
        var innerStyle = $"color:{Esc(color)};line-height:1.7;" +
                         (maxWidth > 0 ? $"max-width:{maxWidth}px;margin:0 auto" : "");

        return $"""
            <div style="{wrapStyle}">
              <div style="{innerStyle}" class="puck-richtext {fsClass}">
                {contenidoHtml}
              </div>
            </div>
            """;
    }

    // ── IMAGEN ────────────────────────────────────────────────────────────────

    private static string RenderImagen(JsonElement p)
    {
        var url         = Str(p, "url");
        var alt         = Str(p, "alt");
        var width       = Str(p, "width", "100%");
        var maxHeight   = Num(p, "maxHeight");
        var fit         = Str(p, "fit", "cover");
        var align       = Str(p, "align", "center");
        var rounded     = Num(p, "rounded");
        var bgColor     = Str(p, "bgColor", "transparent");
        var cardPadding = p.TryGetProperty("cardPadding", out var cpEl) ? cpEl.GetDouble() : 0;
        var shadow      = Str(p, "shadow", "none");
        var paddingV    = p.TryGetProperty("paddingV", out var pvEl) ? pvEl.GetDouble() : 0;
        var paddingH    = p.TryGetProperty("paddingH", out var phEl) ? phEl.GetDouble() : 0;
        var linkUrl     = Str(p, "linkUrl");

        if (string.IsNullOrEmpty(url)) return "";

        var outerPad = (paddingV > 0 || paddingH > 0)
            ? $"padding:{RemVal(paddingV)} {RemVal(paddingH)};"
            : "";
        var cardPad   = cardPadding > 0 ? $"padding:{RemVal(cardPadding)};" : "";
        var boxShadow = shadow == "subtle" ? "box-shadow:0 1px 4px rgba(0,0,0,.12);" : "";
        var maxHStr   = maxHeight > 0 ? $"max-height:{maxHeight}px;" : "";

        var imgStyle = $"width:100%;{maxHStr}object-fit:{Esc(fit)};border-radius:{rounded}px;display:block";
        var img      = $"""<img src="{Esc(url)}" alt="{Esc(alt)}" style="{imgStyle}" />""";

        if (!string.IsNullOrEmpty(linkUrl))
            img = $"""<a href="{Esc(linkUrl)}" target="_blank" rel="noopener">{img}</a>""";

        var cardStyle = $"display:inline-block;width:{Esc(width)};box-sizing:border-box;background:{Esc(bgColor)};{cardPad}border-radius:{rounded}px;{boxShadow}";
        var card      = $"""<div style="{cardStyle}">{img}</div>""";

        return $"""<div style="{outerPad}display:flex;justify-content:{Esc(align)}">{card}</div>""" + "\n";
    }

    // ── VIDEO ─────────────────────────────────────────────────────────────────

    private static string RenderVideo(JsonElement p)
    {
        var url    = Str(p, "url");
        var height = Num(p, "height", 400);

        if (string.IsNullOrEmpty(url)) return "";

        var embedUrl = GetVideoEmbedUrl(url);
        return $"""
            <div style="width:100%;height:{height}px">
              <iframe src="{Esc(embedUrl)}" width="100%" height="{height}"
                style="border:none;display:block"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen></iframe>
            </div>
            """;
    }

    private static string GetVideoEmbedUrl(string raw)
    {
        // YouTube long URL
        var ytIdx = raw.IndexOf("youtube.com/watch?v=", StringComparison.OrdinalIgnoreCase);
        if (ytIdx >= 0)
        {
            var start = ytIdx + "youtube.com/watch?v=".Length;
            var end   = raw.IndexOf('&', start);
            var vid   = end < 0 ? raw[start..] : raw[start..end];
            return $"https://www.youtube.com/embed/{vid}";
        }
        // YouTube short URL
        var ytbIdx = raw.IndexOf("youtu.be/", StringComparison.OrdinalIgnoreCase);
        if (ytbIdx >= 0)
        {
            var start = ytbIdx + "youtu.be/".Length;
            var end   = raw.IndexOf('?', start);
            var vid   = end < 0 ? raw[start..] : raw[start..end];
            return $"https://www.youtube.com/embed/{vid}";
        }
        // Vimeo
        var vmIdx = raw.IndexOf("vimeo.com/", StringComparison.OrdinalIgnoreCase);
        if (vmIdx >= 0)
        {
            var start = vmIdx + "vimeo.com/".Length;
            var end   = raw.IndexOfAny(['?', '/'], start);
            var vid   = end < 0 ? raw[start..] : raw[start..end];
            return $"https://player.vimeo.com/video/{vid}";
        }
        return raw;
    }

    // ── BOTÓN ─────────────────────────────────────────────────────────────────

    private static string RenderBoton(JsonElement p)
    {
        var label   = Str(p, "label", "Botón");
        var url     = Str(p, "url", "#");
        var color   = Str(p, "color", "#4f46e5");
        var size    = Str(p, "size", "md");
        var variant = Str(p, "variant", "solid");
        var align   = Str(p, "align", "center");

        var pads = size switch { "sm" => ".5rem 1.25rem", "lg" => "1rem 2.75rem", _ => ".75rem 2rem" };
        var font = size switch { "sm" => ".8125rem", "lg" => "1.125rem", _ => "1rem" };
        var bg   = variant == "solid" ? Esc(color) : "transparent";
        var txt  = variant == "solid" ? "#fff" : Esc(color);

        var btnStyle = $"padding:{pads};border-radius:8px;border:2px solid {Esc(color)};" +
                       $"background:{bg};color:{txt};font-weight:700;font-size:{font};" +
                       "text-decoration:none;display:inline-block";

        return $"""
            <div style="display:flex;justify-content:{Esc(align)};padding:.5rem 0">
              <a href="{Esc(url)}" style="{btnStyle}">{Esc(label)}</a>
            </div>
            """;
    }

    // ── BANDA COLOR ───────────────────────────────────────────────────────────

    private static string RenderBandaColor(JsonElement p)
    {
        var bgColor   = Str(p, "bgColor", "#4f46e5");
        var texto     = Str(p, "texto");
        var color     = Str(p, "color", "#ffffff");
        var height    = Num(p, "height", 80);
        var fontSize  = Num(p, "fontSize", 18);
        var alignment = Str(p, "alignment", "center");

        var justifyContent = alignment switch
        {
            "left"  => "flex-start",
            "right" => "flex-end",
            _       => "center"
        };

        var fsClass   = FontSizeClass(p, "fs-lg");
        var textoHtml = !string.IsNullOrEmpty(texto)
            ? $"""<p class="{fsClass}" style="margin:0;color:{Esc(color)};font-weight:600;text-align:{Esc(alignment)}">{Esc(texto)}</p>"""
            : "";

        return $"""
            <div style="background:{Esc(bgColor)};min-height:{height}px;display:flex;align-items:center;justify-content:{justifyContent};padding:1rem 2rem">
              {textoHtml}
            </div>
            """;
    }

    // ── SEPARADOR ─────────────────────────────────────────────────────────────

    private static string RenderSeparador(JsonElement p)
    {
        var height = Num(p, "height", 48);
        var line   = Str(p, "line", "none");
        var color  = Str(p, "color", "#e5e7eb");

        var hrHtml = line != "none"
            ? $"""<hr style="width:100%;border:none;border-top:1px {Esc(line)} {Esc(color)};margin:0" />"""
            : "";

        return $"""<div style="height:{height}px;display:flex;align-items:center;padding:0 2rem">{hrHtml}</div>""" + "\n";
    }

    // ── MAPA ──────────────────────────────────────────────────────────────────

    private static string RenderMapa(JsonElement p)
    {
        var query  = Str(p, "query");
        var height = Num(p, "height", 400);
        var zoom   = Num(p, "zoom", 14);

        if (string.IsNullOrWhiteSpace(query)) return "";

        var encodedQuery = Uri.EscapeDataString(query);
        var src = $"https://maps.google.com/maps?q={encodedQuery}&z={zoom}&output=embed";

        return $"""<iframe src="{src}" width="100%" height="{height}" style="border:none;display:block" loading="lazy" allowfullscreen title="Mapa de ubicación"></iframe>""" + "\n";
    }

    // ── STATS ─────────────────────────────────────────────────────────────────

    private static string RenderStats(JsonElement p)
    {
        var bgColor = Str(p, "bgColor", "#f5f3ff");
        var color   = Str(p, "color", "#4f46e5");

        var stats = new List<(string v, string l)>
        {
            (Str(p, "stat1valor"), Str(p, "stat1label")),
            (Str(p, "stat2valor"), Str(p, "stat2label")),
            (Str(p, "stat3valor"), Str(p, "stat3label")),
        };
        var s4v = Str(p, "stat4valor");
        if (!string.IsNullOrEmpty(s4v))
            stats.Add((s4v, Str(p, "stat4label")));

        var sb = new StringBuilder();
        sb.AppendLine($"""<div style="background:{Esc(bgColor)};padding:3rem 2rem">""");
        sb.AppendLine($"""  <div style="display:grid;grid-template-columns:repeat({stats.Count},1fr);gap:1rem;max-width:800px;margin:0 auto;text-align:center">""");
        foreach (var (v, l) in stats)
        {
            sb.AppendLine("    <div>");
            sb.AppendLine($"""      <div style="font-size:3rem;font-weight:900;color:{Esc(color)};line-height:1">{Esc(v)}</div>""");
            sb.AppendLine($"""      <div style="font-size:.875rem;color:#6b7280;margin-top:.25rem;font-weight:500">{Esc(l)}</div>""");
            sb.AppendLine("    </div>");
        }
        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    // ── GALERÍA LOGOS ─────────────────────────────────────────────────────────

    private static string RenderGaleriaLogos(JsonElement p)
    {
        var columnas   = Str(p, "columnas", "3");
        var alturaLogo = Num(p, "alturaLogo", 48);
        var gap        = Num(p, "gap", 24);
        var bgColor    = Str(p, "bgColor", "#f1f5f9");
        var paddingV   = Num(p, "paddingV", 32);

        var sb = new StringBuilder();
        sb.AppendLine($"""<div style="background:{Esc(bgColor)};padding:{RemVal(paddingV)} 2rem">""");
        sb.AppendLine($"""  <div style="display:grid;grid-template-columns:repeat({Esc(columnas)},1fr);gap:{RemVal(gap)};align-items:center;max-width:960px;margin:0 auto">""");

        if (p.ValueKind != JsonValueKind.Undefined && p.TryGetProperty("imagenes", out var imgs))
        {
            var i = 0;
            foreach (var img in imgs.EnumerateArray())
            {
                var url     = img.TryGetProperty("url",     out var u) ? u.GetString() ?? "" : "";
                var alt     = img.TryGetProperty("alt",     out var a) ? a.GetString() ?? "" : "";
                var linkUrl = img.TryGetProperty("linkUrl", out var l) ? l.GetString() ?? "" : "";

                string imgHtml;
                if (!string.IsNullOrEmpty(url))
                    imgHtml = $"""<img src="{Esc(url)}" alt="{Esc(alt)}" style="max-height:{alturaLogo}px;width:auto;max-width:100%;object-fit:contain;display:block;margin:0 auto" />""";
                else
                    imgHtml = $"""<div style="height:{alturaLogo}px;background:#e2e8f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:.7rem">Logo {i + 1}</div>""";

                var inner = !string.IsNullOrEmpty(linkUrl)
                    ? $"""<a href="{Esc(linkUrl)}" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;justify-content:center">{imgHtml}</a>"""
                    : $"""<div style="display:flex;align-items:center;justify-content:center">{imgHtml}</div>""";

                sb.AppendLine($"    {inner}");
                i++;
            }
        }

        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    // ── CUENTA REGRESIVA ──────────────────────────────────────────────────────

    private static string RenderCuentaRegresiva(JsonElement p)
    {
        var targetDate   = Str(p, "targetDate");
        var titulo       = Str(p, "titulo", "⏳ El evento comienza en");
        var mostrarDias  = Str(p, "mostrarDias", "si");
        var mostrarHoras = Str(p, "mostrarHoras", "si");
        var mostrarMins  = Str(p, "mostrarMinutos", "si");
        var mostrarSegs  = Str(p, "mostrarSegundos", "si");
        var labelDias    = Str(p, "labelDias", "días");
        var labelHoras   = Str(p, "labelHoras", "horas");
        var labelMins    = Str(p, "labelMinutos", "min");
        var labelSegs    = Str(p, "labelSegundos", "seg");
        var color        = Str(p, "color", "#1e3a5f");
        var colorLabel   = Str(p, "colorLabel", "#64748b");
        var bgColor      = Str(p, "bgColor", "#f8fafc");
        var paddingV     = Num(p, "paddingV", 48);
        var fontSize     = Num(p, "fontSize", 56);
        var tituloFontSz = Num(p, "tituloFontSize", 18);
        var tituloColor  = Str(p, "tituloColor", "#334155");
        var fontFamily   = Str(p, "fontFamily");
        var alineacion   = Str(p, "alineacion", "center");

        // Compute static values at build time
        var countdownItems = new List<(string val, string label)>();
        if (!string.IsNullOrEmpty(targetDate) && DateTime.TryParse(targetDate, out var target))
        {
            var diff = target - DateTime.UtcNow;
            if (diff > TimeSpan.Zero)
            {
                var total   = (long)diff.TotalSeconds;
                var days    = total / 86400;
                var hours   = (total % 86400) / 3600;
                var minutes = (total % 3600) / 60;
                var seconds = total % 60;

                if (mostrarDias  == "si") countdownItems.Add((days.ToString(),           labelDias));
                if (mostrarHoras == "si") countdownItems.Add((hours.ToString("D2"),       labelHoras));
                if (mostrarMins  == "si") countdownItems.Add((minutes.ToString("D2"),     labelMins));
                if (mostrarSegs  == "si") countdownItems.Add((seconds.ToString("D2"),     labelSegs));
            }
        }

        var uniqueId  = $"cd-{Guid.NewGuid():N}";
        var fontStyle = !string.IsNullOrEmpty(fontFamily) ? $"font-family:{Esc(fontFamily)};" : "";
        var alignText = alineacion == "left" ? "left" : alineacion == "right" ? "right" : "center";

        var sb = new StringBuilder();
        AppendGoogleFontLink(sb, fontFamily);

        sb.AppendLine($"""<div id="{uniqueId}" style="background:{Esc(bgColor)};padding:{RemVal(paddingV)} 2rem;{fontStyle}text-align:{alignText}">""");

        if (!string.IsNullOrEmpty(titulo))
            sb.AppendLine($"""  <div style="font-size:{RemVal(tituloFontSz)};color:{Esc(tituloColor)};margin-bottom:1.5rem;font-weight:600">{Esc(titulo)}</div>""");

        sb.AppendLine($"""  <div class="cd-display" style="display:inline-flex;gap:1.5rem;flex-wrap:wrap;justify-content:{alignText}">""");
        foreach (var (val, lbl) in countdownItems)
        {
            sb.AppendLine("    <div>");
            sb.AppendLine($"""      <div class="cd-val" style="font-size:{RemVal(fontSize)};font-weight:900;color:{Esc(color)};line-height:1">{val}</div>""");
            sb.AppendLine($"""      <div style="font-size:.875rem;color:{Esc(colorLabel)};margin-top:.25rem">{Esc(lbl)}</div>""");
            sb.AppendLine("    </div>");
        }
        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");

        // Vanilla JS for live update (no React, no framework)
        if (!string.IsNullOrEmpty(targetDate))
        {
            var showDias  = mostrarDias  == "si" ? "true" : "false";
            var showHoras = mostrarHoras == "si" ? "true" : "false";
            var showMins  = mostrarMins  == "si" ? "true" : "false";
            var showSegs  = mostrarSegs  == "si" ? "true" : "false";

            // Build JS separately to avoid brace-escape conflicts with C# interpolated strings
            var js = new StringBuilder();
            js.AppendLine("<script>");
            js.AppendLine("(function(){");
            js.AppendLine($"  var tgt=new Date(\"{Esc(targetDate)}\").getTime();");
            js.AppendLine($"  var el=document.getElementById(\"{uniqueId}\");");
            js.AppendLine("  if(!el)return;");
            js.AppendLine("  var vals=el.querySelectorAll(\".cd-val\");");
            js.AppendLine($"  var show=[{showDias},{showHoras},{showMins},{showSegs}];");
            js.AppendLine("  function tick(){");
            js.AppendLine("    var diff=Math.max(0,Math.floor((tgt-Date.now())/1000));");
            js.AppendLine("    var parts=[Math.floor(diff/86400),Math.floor(diff%86400/3600),Math.floor(diff%3600/60),diff%60];");
            js.AppendLine("    var idx=0;");
            js.AppendLine("    for(var i=0;i<4;i++){if(show[i]&&vals[idx]){vals[idx].textContent=i===0?parts[i]:String(parts[i]).padStart(2,'0');idx++;}}");
            js.AppendLine("  }");
            js.AppendLine("  tick();setInterval(tick,1000);");
            js.AppendLine("})();");
            js.AppendLine("</script>");
            sb.Append(js);
        }

        return sb.ToString();
    }

    // ── LAYOUT BLOCKS ─────────────────────────────────────────────────────────

    private static string RenderSeccionFondo(JsonElement p, string id, RenderContext ctx)
    {
        var bgColor  = Str(p, "bgColor", "#ffffff");
        var bgImage  = Str(p, "bgImage");
        var padding  = Num(p, "padding", 48);
        var maxWidth = Num(p, "maxWidth", 900);

        var bg = !string.IsNullOrEmpty(bgImage)
            ? $"url({Esc(bgImage)}) center/cover no-repeat"
            : Esc(bgColor);
        var mw = maxWidth > 0 ? $"{maxWidth}px" : "100%";

        var inner = RenderZone(id, "content", ctx);

        return $"""
            <section style="background:{bg};padding:{RemVal(padding)} 2rem">
              <div style="max-width:{mw};margin:0 auto">
                {inner}
              </div>
            </section>
            """;
    }

    private static string RenderDosColumnas(JsonElement p, string id, RenderContext ctx)
    {
        var gap        = Num(p, "gap", 32);
        var paddingV   = Num(p, "paddingV", 32);
        var paddingH   = Num(p, "paddingH", 32);
        var ratio      = Str(p, "ratio", "1fr 1fr");
        var alignItems = Str(p, "alignItems", "flex-start");

        var left  = RenderZone(id, "left",  ctx);
        var right = RenderZone(id, "right", ctx);

        return $"""
            <div style="display:grid;grid-template-columns:{Esc(ratio)};gap:{RemVal(gap)};align-items:{Esc(alignItems)};padding:{RemVal(paddingV)} {RemVal(paddingH)}">
              <div>{left}</div>
              <div>{right}</div>
            </div>
            """;
    }

    private static string RenderTresColumnas(JsonElement p, string id, RenderContext ctx)
    {
        var gap      = Num(p, "gap", 24);
        var paddingV = Num(p, "paddingV", 32);
        var paddingH = Num(p, "paddingH", 32);

        var col1 = RenderZone(id, "col1", ctx);
        var col2 = RenderZone(id, "col2", ctx);
        var col3 = RenderZone(id, "col3", ctx);

        return $"""
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:{RemVal(gap)};padding:{RemVal(paddingV)} {RemVal(paddingH)}">
              <div>{col1}</div>
              <div>{col2}</div>
              <div>{col3}</div>
            </div>
            """;
    }

    // ── DYNAMIC BLOCKS ────────────────────────────────────────────────────────

    private static string RenderFechasImportantes(RenderContext ctx)
    {
        if (ctx.FechasImportantes.Count == 0) return "";

        var sb = new StringBuilder();
        sb.AppendLine("""<div style="padding:2rem">""");
        sb.AppendLine("""  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">Fechas importantes</h2>""");
        sb.AppendLine("""  <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:.75rem">""");

        foreach (var f in ctx.FechasImportantes.OrderBy(x => x.Fecha))
        {
            var fechaStr = f.Fecha.ToString("dd/MM/yyyy", EsAr);
            if (f.FechaFin.HasValue)
                fechaStr += $" – {f.FechaFin.Value.ToString("dd/MM/yyyy", EsAr)}";

            sb.AppendLine($"""
                  <li style="display:flex;gap:1rem;align-items:center;padding:.625rem 1rem;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">
                    <span style="font-weight:700;color:#1e40af;white-space:nowrap;font-size:.875rem">{Esc(fechaStr)}</span>
                    <span style="color:#374151;font-size:.9375rem">{Esc(f.Descripcion)}</span>
                  </li>
                """);
        }

        sb.AppendLine("  </ul>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    private static string RenderOrganizadores(RenderContext ctx)
    {
        if (ctx.Organizadores.Count == 0) return "";

        var sb = new StringBuilder();
        sb.AppendLine("""<div style="padding:2rem">""");
        sb.AppendLine("""  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1.25rem">Organizadores</h2>""");
        sb.AppendLine("""  <div style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center">""");

        foreach (var o in ctx.Organizadores.OrderBy(x => x.Orden))
        {
            if (!string.IsNullOrEmpty(o.LogoUrl))
                sb.AppendLine($"""    <div><img src="{Esc(o.LogoUrl)}" alt="{Esc(o.Nombre)}" style="max-height:48px;max-width:160px;object-fit:contain" /></div>""");
            else
                sb.AppendLine($"""    <div style="font-weight:600;color:#374151">{Esc(o.Nombre)}</div>""");
        }

        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    private static string RenderContacto(RenderContext ctx)
    {
        var c = ctx.Conf;
        if (string.IsNullOrEmpty(c.EmailContacto) && string.IsNullOrEmpty(c.Instagram) &&
            string.IsNullOrEmpty(c.ContactoAdicional) && string.IsNullOrEmpty(c.FormularioInscripcionUrl))
            return "";

        var sb = new StringBuilder();
        sb.AppendLine("""<div style="padding:2rem">""");
        sb.AppendLine("""  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">Contacto</h2>""");
        sb.AppendLine("""  <div style="display:flex;flex-direction:column;gap:.75rem">""");

        if (!string.IsNullOrEmpty(c.EmailContacto))
            sb.AppendLine($"""    <a href="mailto:{Esc(c.EmailContacto)}" style="color:#1e40af;font-weight:600;font-size:1rem">✉ {Esc(c.EmailContacto)}</a>""");

        if (!string.IsNullOrEmpty(c.Instagram))
            sb.AppendLine($"""    <a href="https://instagram.com/{Esc(c.Instagram)}" target="_blank" rel="noopener noreferrer" style="color:#1e40af;font-weight:600;font-size:1rem">📷 @{Esc(c.Instagram)}</a>""");

        if (!string.IsNullOrEmpty(c.FormularioInscripcionUrl))
            sb.AppendLine($"""    <a href="{Esc(c.FormularioInscripcionUrl)}" target="_blank" rel="noopener noreferrer" style="color:#1e40af;font-weight:600;font-size:1rem">📝 Formulario de inscripción</a>""");

        if (!string.IsNullOrEmpty(c.ContactoAdicional))
            sb.AppendLine($"""    <p style="font-size:.95rem;color:#475569;white-space:pre-line;margin:.5rem 0 0">{TipTapHtmlConverter.ProcessTextInlineLinks(c.ContactoAdicional)}</p>""");

        sb.AppendLine("  </div>");
        sb.AppendLine("</div>");
        return sb.ToString();
    }

    private static string RenderInscripciones(RenderContext ctx)
    {
        var c = ctx.Conf;
        if (string.IsNullOrEmpty(c.FormularioInscripcionUrl) && string.IsNullOrEmpty(c.ArancelesTexto))
            return "";

        var sb = new StringBuilder();
        sb.AppendLine("""<div style="padding:2rem">""");
        sb.AppendLine("""  <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:1rem">Inscripciones</h2>""");

        if (!string.IsNullOrEmpty(c.ArancelesTexto))
            sb.AppendLine($"""  <p style="color:#374151;white-space:pre-line;margin-bottom:1rem">{Esc(c.ArancelesTexto)}</p>""");

        if (!string.IsNullOrEmpty(c.FormularioInscripcionUrl))
            sb.AppendLine($"""  <a href="{Esc(c.FormularioInscripcionUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:.75rem 2rem;background:#4f46e5;color:#fff;font-weight:700;border-radius:8px;text-decoration:none">📝 Formulario de inscripción</a>""");

        sb.AppendLine("</div>");
        return sb.ToString();
    }

    private static string RenderAgenda() => """
        <div style="padding:2rem;text-align:center">
          <a href="programa.html" style="display:inline-block;padding:.75rem 2rem;background:#0f172a;color:#fff;font-weight:700;border-radius:8px;text-decoration:none">📋 Ver programa completo</a>
        </div>
        """;

    private static string RenderExpositores() => """
        <div style="padding:2rem;text-align:center">
          <a href="expositores.html" style="display:inline-block;padding:.75rem 2rem;background:#0f172a;color:#fff;font-weight:700;border-radius:8px;text-decoration:none">🎤 Ver expositores</a>
        </div>
        """;

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private static void AppendGoogleFontLink(StringBuilder sb, string? fontFamily)
    {
        if (string.IsNullOrEmpty(fontFamily)) return;
        var font = fontFamily.Contains('\'')
            ? fontFamily.Split('\'')[1]
            : fontFamily.Split(',')[0].Trim();
        if (GoogleFonts.Contains(font))
            sb.AppendLine($"""<link href="https://fonts.googleapis.com/css2?family={Uri.EscapeDataString(font)}:wght@400;500;600;700;900&display=swap" rel="stylesheet" />""");
    }

    private static string Str(JsonElement el, string key, string fallback = "") =>
        el.ValueKind != JsonValueKind.Undefined &&
        el.TryGetProperty(key, out var v) &&
        v.ValueKind == JsonValueKind.String
            ? v.GetString() ?? fallback
            : fallback;

    private static int Num(JsonElement el, string key, int fallback = 0) =>
        el.ValueKind != JsonValueKind.Undefined &&
        el.TryGetProperty(key, out var v) &&
        v.ValueKind == JsonValueKind.Number
            ? (int)v.GetDouble()
            : fallback;

    private static string Esc(string? s) =>
        string.IsNullOrEmpty(s) ? "" :
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");

    // Converts a stored numeric value to a CSS rem string using the same
    // smart-migration logic as puck-config.tsx: values >4 are legacy px
    // (divide by 16), values ≤4 are already in rem (use directly).
    private static string RemVal(double v) =>
        v > 4 ? $"{v / 16:0.###}rem" : $"{v:0.###}rem";

    // Maps a stored fontSize prop to one of the fs-* CSS classes (defined in
    // globals.css and the ZIP style block).  Handles both new string values
    // ("fs-2xl") and legacy numeric values stored before the design-token
    // migration.  defaultClass is returned when the prop is absent or zero.
    private static string FontSizeClass(JsonElement props, string defaultClass)
    {
        if (props.ValueKind == JsonValueKind.Undefined ||
            !props.TryGetProperty("fontSize", out var fsProp))
            return defaultClass;

        if (fsProp.ValueKind == JsonValueKind.String)
        {
            var s = fsProp.GetString() ?? "";
            return s.StartsWith("fs-") ? s : defaultClass;
        }

        if (fsProp.ValueKind == JsonValueKind.Number)
        {
            var num = fsProp.GetDouble();
            if (num <= 0) return defaultClass;
            var rem = num > 4 ? num / 16 : num;
            return rem switch
            {
                <= 0.8125 => "fs-xs",
                <= 0.9375 => "fs-sm",
                <= 1.0625 => "fs-base",
                <= 1.25   => "fs-lg",
                <= 1.625  => "fs-xl",
                <= 2.125  => "fs-2xl",
                <= 2.75   => "fs-3xl",
                _         => "fs-4xl",
            };
        }

        return defaultClass;
    }
}
