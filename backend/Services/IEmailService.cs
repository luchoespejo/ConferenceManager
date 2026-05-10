namespace ConferenceManager.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl);
    Task<ServiceResult> SendAsync(string toEmail, string subject, string body);
}
