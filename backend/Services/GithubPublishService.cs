using System.IO.Compression;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ConferenceManager.Services;

public class GithubPublishService(
    IStaticSiteService staticSiteService,
    IConfiguration config,
    IHttpClientFactory httpClientFactory,
    ILogger<GithubPublishService> logger) : IGithubPublishService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<bool> PublishConferenceAsync(Guid conferenciaId, Guid usuarioId)
    {
        var token = config["Github:Token"];
        var owner = config["Github:Owner"] ?? "luchoespejo";
        var repo  = config["Github:Repo"]  ?? "conference-sites";
        var branch = config["Github:Branch"] ?? "main";

        if (string.IsNullOrEmpty(token))
        {
            logger.LogWarning("Github:Token not configured — skipping static publish");
            return false;
        }

        // 1. Generar zip estático
        var zip = await staticSiteService.GenerateZipAsync(conferenciaId, usuarioId);
        if (zip is null) return false;

        // 2. Extraer archivos del zip → dict path→content
        var files = new Dictionary<string, string>();
        using (var ms = new MemoryStream(zip.Data))
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Read))
        {
            foreach (var entry in archive.Entries)
            {
                if (entry.Length == 0) continue;
                using var reader = new StreamReader(entry.Open(), Encoding.UTF8);
                var content = await reader.ReadToEndAsync();
                // Ruta en el repo: {slug}/{path-dentro-del-zip}
                files[$"{zip.Slug}/{entry.FullName}"] = content;
            }
        }

        if (files.Count == 0) return false;

        var client = CreateGithubClient(token);
        var baseUrl = $"https://api.github.com/repos/{owner}/{repo}";

        try
        {
            // 3. Obtener SHA del último commit de la branch
            var (commitSha, usedBranch) = await GetLatestCommitSha(client, baseUrl, branch);

            // 4. Obtener SHA del tree actual
            var treeSha = await GetTreeSha(client, baseUrl, commitSha);

            // 5. Crear blobs para cada archivo
            var treeItems = new List<TreeItem>();
            foreach (var (path, content) in files)
            {
                var blobSha = await CreateBlob(client, baseUrl, content);
                treeItems.Add(new TreeItem(path, "100644", "blob", blobSha));
            }

            // 6. Crear nuevo tree
            var newTreeSha = await CreateTree(client, baseUrl, treeSha, treeItems);

            // 7. Crear commit
            var newCommitSha = await CreateCommit(client, baseUrl, $"Deploy: {zip.Slug}", newTreeSha, commitSha);

            // 8. Actualizar ref de la branch
            await UpdateRef(client, baseUrl, usedBranch, newCommitSha);

            logger.LogInformation("Published conference '{Slug}' to GitHub ({Owner}/{Repo})", zip.Slug, owner, repo);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish conference '{Slug}' to GitHub", zip.Slug);
            return false;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpClient CreateGithubClient(string token)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("ConferenceManager/1.0");
        client.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
        client.DefaultRequestHeaders.Add("X-GitHub-Api-Version", "2022-11-28");
        return client;
    }

    private static async Task<(string CommitSha, string Branch)> GetLatestCommitSha(
        HttpClient client, string baseUrl, string branch)
    {
        var res = await client.GetAsync($"{baseUrl}/git/ref/heads/{branch}");
        if (!res.IsSuccessStatusCode && branch == "main")
        {
            // Fallback a master
            res = await client.GetAsync($"{baseUrl}/git/ref/heads/master");
            branch = "master";
        }
        res.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        var sha = json.RootElement.GetProperty("object").GetProperty("sha").GetString()!;
        return (sha, branch);
    }

    private static async Task<string> GetTreeSha(HttpClient client, string baseUrl, string commitSha)
    {
        var res = await client.GetAsync($"{baseUrl}/git/commits/{commitSha}");
        res.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("tree").GetProperty("sha").GetString()!;
    }

    private static async Task<string> CreateBlob(HttpClient client, string baseUrl, string content)
    {
        var body = JsonSerializer.Serialize(new
        {
            content = Convert.ToBase64String(Encoding.UTF8.GetBytes(content)),
            encoding = "base64"
        });
        var res = await client.PostAsync($"{baseUrl}/git/blobs",
            new StringContent(body, Encoding.UTF8, "application/json"));
        res.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("sha").GetString()!;
    }

    private static async Task<string> CreateTree(
        HttpClient client, string baseUrl, string baseTreeSha, List<TreeItem> items)
    {
        var body = JsonSerializer.Serialize(new
        {
            base_tree = baseTreeSha,
            tree = items.Select(i => new { i.Path, i.Mode, i.Type, i.Sha })
        });
        var res = await client.PostAsync($"{baseUrl}/git/trees",
            new StringContent(body, Encoding.UTF8, "application/json"));
        res.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("sha").GetString()!;
    }

    private static async Task<string> CreateCommit(
        HttpClient client, string baseUrl, string message, string treeSha, string parentSha)
    {
        var body = JsonSerializer.Serialize(new
        {
            message,
            tree = treeSha,
            parents = new[] { parentSha }
        });
        var res = await client.PostAsync($"{baseUrl}/git/commits",
            new StringContent(body, Encoding.UTF8, "application/json"));
        res.EnsureSuccessStatusCode();
        var json = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("sha").GetString()!;
    }

    private static async Task UpdateRef(
        HttpClient client, string baseUrl, string branch, string commitSha)
    {
        var body = JsonSerializer.Serialize(new { sha = commitSha, force = false });
        var res = await client.PatchAsync($"{baseUrl}/git/refs/heads/{branch}",
            new StringContent(body, Encoding.UTF8, "application/json"));
        res.EnsureSuccessStatusCode();
    }

    private record TreeItem(string Path, string Mode, string Type, string Sha);
}
