namespace ConferenceManager.Models;

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UsuarioId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; } = false;
    public DateTime CreatedAt { get; set; }
    public Usuario Usuario { get; set; } = null!;
}
