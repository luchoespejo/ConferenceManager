using System.Text;
using System.Text.Json;

namespace ConferenceManager.Services;

/// <summary>
/// Converts TipTap v3 JSON (as stored by Puck richtext fields) to HTML.
/// Handles both raw HTML strings (from defaultProps) and TipTap JSON objects.
/// </summary>
public static class TipTapHtmlConverter
{
    public static string ToHtml(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.String => element.GetString() ?? "",
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
            var text = node.TryGetProperty("text", out var textEl) ? Esc(textEl.GetString() ?? "") : "";

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
