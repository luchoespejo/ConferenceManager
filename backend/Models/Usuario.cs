namespace ConferenceManager.Models;

public class Usuario
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Organizacion { get; set; } = string.Empty;
    public bool EmailVerificado { get; set; } = false;
    public string? VerificationToken { get; set; }
    public DateTime? VerificationTokenExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
