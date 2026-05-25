namespace ConferenceManager.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);

    /// <summary>Sends a generic email. Returns true when delivery succeeded.</summary>
    Task<bool> SendAsync(string toEmail, string subject, string body, string? replyTo = null, string? fromDisplayName = null);
}
