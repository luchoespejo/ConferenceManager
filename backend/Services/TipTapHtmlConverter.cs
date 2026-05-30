using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace ConferenceManager.Services;

/// <summary>
/// Converts TipTap v3 JSON (as stored by Puck richtext fields) to HTML.
/// Handles both raw HTML strings (from defaultProps) and TipTap JSON objects.
/// </summary>
public static class TipTapHtmlConverter
{
    // ── Inline link tags ─────────────────────────────────────────────────────
    // Syntax: [[#url:https://...|Display]]  [[#mail:email@...|Display]]  [[#ig:@user|Display]]
    // Display text after | is optional; falls back to the raw value.
    // Value/display may contain inline HTML tags (e.g. [[#ig:<strong>@user</strong>]])
    // when the user bolded text in the editor — StripHtml() removes them before use.
    private static readonly Regex InlineLinkRe = new(
        @"\[\[#(url|mail|ig):([^\]|]+)(?:\|([^\]]+))?\]\]",
        RegexOptions.Compiled);

    private static readonly Regex HtmlTagRe = new(@"<[^>]+>", RegexOptions.Compiled);
    private static string StripHtml(string s) => HtmlTagRe.Replace(s, "").Trim();

    /// <summary>
    /// Process inline link tags in a plain-text string (TipTap text node).
    /// Surrounding text is HTML-escaped; link tags become &lt;a&gt; elements.
    /// </summary>
    public static string ProcessTextInlineLinks(string rawText)
    {
        var matches = InlineLinkRe.Matches(rawText);
        if (matches.Count == 0) return Esc(rawText);

        var sb = new StringBuilder();
        int lastIndex = 0;
        foreach (Match m in matches)
        {
            sb.Append(Esc(rawText[lastIndex..m.Index]));
            var tag   = m.Groups[1].Value;
            var value = StripHtml(m.Groups[2].Value);
            var disp  = m.Groups[3].Success ? StripHtml(m.Groups[3].Value) : value;
            var href  = tag switch
            {
                "mail" => $"mailto:{value}",
                "ig"   => $"https://instagram.com/{value.TrimStart('@')}",
                _      => value
            };
            sb.Append($"""<a href="{Esc(href)}" target="_blank" rel="noopener noreferrer">{Esc(disp)}</a>""");
            lastIndex = m.Index + m.Length;
        }
        sb.Append(Esc(rawText[lastIndex..]));
        return sb.ToString();
    }

    /// <summary>
    /// Process inline link tags inside an already-HTML string (e.g. defaultProps HTML).
    /// Does NOT re-escape surrounding context — assumes it is already valid HTML.
    /// </summary>
    public static string ProcessHtmlInlineLinks(string html)
    {
        // Replace Quill's &nbsp; with regular spaces so text wraps correctly in static output.
        // Quill uses &nbsp; instead of space; in static HTML this prevents line-breaking.
        var processed = html.Replace("&nbsp;", " ");
        return InlineLinkRe.Replace(processed, m =>
        {
            var tag   = m.Groups[1].Value;
            var value = StripHtml(m.Groups[2].Value);
            var disp  = m.Groups[3].Success ? Esc(StripHtml(m.Groups[3].Value)) : Esc(value);
            var href  = tag switch
            {
                "mail" => $"mailto:{value}",
                "ig"   => $"https://instagram.com/{value.TrimStart('@')}",
                _      => value
            };
            return $"""<a href="{Esc(href)}" target="_blank" rel="noopener noreferrer">{disp}</a>""";
        });
    }

    public static string ToHtml(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => ProcessHtmlInlineLinks(element.GetString() ?? ""),
            JsonValueKind.Object => RenderNode(element),
            _ => ""
        };
    }

    private static string RenderNode(JsonElement node)
    {
        if (!node.TryGetProperty("type", out var typeEl)) return "";
        var type = typeEl.GetString() ?? "";

        if (type == "text")
        {
            // ProcessTextInlineLinks handles both Esc() and inline link replacement
            var rawText = node.TryGetProperty("text", out var textEl) ? textEl.GetString() ?? "" : "";
            var text = ProcessTextInlineLinks(rawText);

            if (node.TryGetProperty("marks", out var marks))
            {
                foreach (var mark in marks.EnumerateArray())
                {
                    if (!mark.TryGetProperty("type", out var mt)) continue;
                    text = mt.GetString() switch
                    {
                        "bold"      => $"<strong>{text}</strong>",
                        "italic"    => $"<em>{text}</em>",
                        "underline" => $"<u>{text}</u>",
                        "strike"    => $"<s>{text}</s>",
                        "code"      => $"<code>{text}</code>",
                        "link"      => $"<a href=\"{MarkAttr(mark, "href", "#")}\" target=\"_blank\" rel=\"noopener\">{text}</a>",
                        _           => text
                    };
                }
            }
            return text;
        }

        var inner = Children(node);

        return type switch
        {
            "doc"           => inner,
            "paragraph"     => $"<p>{inner}</p>",
            "hardBreak"     => "<br>",
            "horizontalRule"=> "<hr>",
            "bulletList"    => $"<ul>{inner}</ul>",
            "orderedList"   => $"<ol>{inner}</ol>",
            "listItem"      => $"<li>{inner}</li>",
            "blockquote"    => $"<blockquote style=\"border-left:3px solid #e5e7eb;margin:0;padding-left:1rem;color:#64748b\">{inner}</blockquote>",
            "codeBlock"     => $"<pre style=\"background:#f1f5f9;padding:1rem;border-radius:6px;overflow-x:auto\"><code>{inner}</code></pre>",
            "heading"       => HeadingNode(node, inner),
            _               => inner
        };
    }

    private static string HeadingNode(JsonElement node, string inner)
    {
        var level = 2;
        string? align = null;
        if (node.TryGetProperty("attrs", out var attrs))
        {
            if (attrs.TryGetProperty("level", out var lvl)) level = lvl.GetInt32();
            if (attrs.TryGetProperty("textAlign", out var ta)) align = ta.GetString();
        }
        var style = align is not null ? $" style=\"text-align:{Esc(align)}\"" : "";
        return $"<h{level}{style}>{inner}</h{level}>";
    }

    private static string Children(JsonElement node)
    {
        if (!node.TryGetProperty("content", out var children)) return "";
        var sb = new StringBuilder();
        foreach (var child in children.EnumerateArray())
            sb.Append(RenderNode(child));
        return sb.ToString();
    }

    private static string MarkAttr(JsonElement mark, string key, string fallback) =>
        mark.TryGetProperty("attrs", out var a) && a.TryGetProperty(key, out var v)
            ? Esc(v.GetString() ?? fallback)
            : fallback;

    public static string Esc(string s) =>
        s.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;").Replace("\"", "&quot;");
}
