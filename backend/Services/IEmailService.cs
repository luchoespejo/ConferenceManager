namespace ConferenceManager.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);
}
