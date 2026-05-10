namespace ConferenceManager.Models;

public class ExpositorCredencial
{
    public Guid Id { get; set; }
    public Guid ExpositorId { get; set; }
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public Expositor Expositor { get; set; } = null!;
}
