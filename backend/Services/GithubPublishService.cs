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
        logger.LogInformation("[GitHub] PublishConferenceAsync START — conferenciaId={Id}", conferenciaId);

        var token  = config["Github:Token"];
        var owner  = config["Github:Owner"]  ?? "luchoespejo";
        var repo   = config["Github:Repo"]   ?? "conference-sites";
        var branch = config["Github:Branch"] ?? "main";

        logger.LogInformation("[GitHub] Config — owner={Owner} repo={Repo} branch={Branch} tokenSet={HasToken}",
            owner, repo, branch, !string.IsNullOrEmpty(token));

        if (string.IsNullOrEmpty(token))
        {
            logger.LogWarning("[GitHub] Github:Token not configured — skipping static publish");
            return false;
        }

        // 1. Generar zip estático
        logger.LogInformation("[GitHub] Generating static zip...");
        StaticSiteZip? zip;
        try
        {
            zip = await staticSiteService.GenerateZipAsync(conferenciaId, usuarioId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[GitHub] GenerateZipAsync threw exception");
            return false;
        }

        if (zip is null)
        {
            logger.LogWarning("[GitHub] GenerateZipAsync returned null — conferencia not found or access denied");
            return false;
        }
        logger.LogInformation("[GitHub] Zip generated — slug={Slug} size={Bytes}B", zip.Slug, zip.Data.Length);

        // 2. Extraer archivos del zip → dict path→bytes (raw, preserves binary files like PDFs)
        var files = new Dictionary<string, byte[]>();
        using (var ms = new MemoryStream(zip.Data))
        using (var archive = new ZipArchive(ms, ZipArchiveMode.Read))
        {
            foreach (var entry in archive.Entries)
            {
                if (entry.Length == 0) continue;
                using var entryStream = entry.Open();
                using var buf = new MemoryStream();
                await entryStream.CopyToAsync(buf);
                var bytes = buf.ToArray();
                files[$"{zip.Slug}/{entry.FullName}"] = bytes;
                logger.LogDebug("[GitHub] File queued: {Path} ({Len} bytes)", $"{zip.Slug}/{entry.FullName}", bytes.Length);
            }
        }

        logger.LogInformation("[GitHub] Files to push: {Count}", files.Count);
        if (files.Count == 0) return false;

        var client  = CreateGithubClient(token);
        var baseUrl = $"https://api.github.com/repos/{owner}/{repo}";

        try
        {
            // 3. Obtener SHA del último commit de la branch
            logger.LogInformation("[GitHub] Fetching latest commit SHA from {BaseUrl}...", baseUrl);
            var (commitSha, usedBranch) = await GetLatestCommitSha(client, baseUrl, branch);
            logger.LogInformation("[GitHub] Latest commit SHA={Sha} branch={Branch}", commitSha, usedBranch);

            // 4. Obtener SHA del tree actual
            var treeSha = await GetTreeSha(client, baseUrl, commitSha);
            logger.LogInformation("[GitHub] Current tree SHA={Sha}", treeSha);

            // 5. Crear blobs para cada archivo
            var treeItems = new List<TreeItem>();
            foreach (var (path, content) in files)
            {
                logger.LogDebug("[GitHub] Creating blob for {Path}...", path);
                var blobSha = await CreateBlob(client, baseUrl, content);
                treeItems.Add(new TreeItem(path, "100644", "blob", blobSha));
            }
            logger.LogInformation("[GitHub] {Count} blobs created", treeItems.Count);

            // 6. Crear nuevo tree
            var newTreeSha = await CreateTree(client, baseUrl, treeSha, treeItems);
            logger.LogInformation("[GitHub] New tree SHA={Sha}", newTreeSha);

            // 7. Crear commit
            var newCommitSha = await CreateCommit(client, baseUrl, $"Deploy: {zip.Slug}", newTreeSha, commitSha);
            logger.LogInformation("[GitHub] New commit SHA={Sha}", newCommitSha);

            // 8. Actualizar ref de la branch
            await UpdateRef(client, baseUrl, usedBranch, newCommitSha);

            logger.LogInformation("[GitHub] ✅ Published '{Slug}' to {Owner}/{Repo} branch={Branch}",
                zip.Slug, owner, repo, usedBranch);
            return true;
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "[GitHub] HTTP error pushing to GitHub — status={Status}", ex.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[GitHub] Unexpected error publishing '{Slug}' to GitHub", zip.Slug);
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

    private static async Task<string> CreateBlob(HttpClient client, string baseUrl, byte[] content)
    {
        var body = JsonSerializer.Serialize(new
        {
            content = Convert.ToBase64String(content),
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
        // GitHub API requires lowercase field names — DO NOT use anonymous type with PascalCase properties
        var body = JsonSerializer.Serialize(new
        {
            base_tree = baseTreeSha,
            tree = items.Select(i => new { path = i.Path, mode = i.Mode, type = i.Type, sha = i.Sha })
        });
        var res = await client.PostAsync($"{baseUrl}/git/trees",
            new StringContent(body, Encoding.UTF8, "application/json"));
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            throw new HttpRequestException($"CreateTree failed {(int)res.StatusCode}: {err}", null, res.StatusCode);
        }
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
