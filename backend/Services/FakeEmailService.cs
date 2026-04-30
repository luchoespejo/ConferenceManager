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
}
