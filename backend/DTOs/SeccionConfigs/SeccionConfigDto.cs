namespace ConferenceManager.DTOs.SeccionConfigs;

public class SeccionConfigDto
{
    public string SeccionKey { get; set; } = null!;
    public string? BgColor { get; set; }
    public string? TextoColor { get; set; }
}

public class UpsertSeccionConfigDto
{
    public string? BgColor { get; set; }
    public string? TextoColor { get; set; }
}
