namespace ConferenceManager.Services;

public class FakeEmailService(ILogger<FakeEmailService> logger) : IEmailService
{
    public Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)
    {
        logger.LogInformation(
            "FAKE EMAIL — To: {Email} | Name: {Name} | Verification URL: {Url}",
            toEmail, toName, verificationUrl);

        return Task.CompletedTask;
    }

    public Task<ServiceResult> SendAsync(string toEmail, string subject, string body, string? replyTo = null, string? fromDisplayName = null)
    {
        logger.LogInformation(
            "FAKE EMAIL — From: {Display} | ReplyTo: {ReplyTo} | To: {Email} | Subject: {Subject} | Body: {Body}",
            fromDisplayName ?? "(default)", replyTo ?? "(none)", toEmail, subject, body);

        return Task.FromResult(ServiceResult.Ok());
    }
}
