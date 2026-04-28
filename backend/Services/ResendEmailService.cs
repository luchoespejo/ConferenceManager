using System.Text;
using System.Text.Json;

namespace ConferenceManager.Services;

public class ResendEmailService(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    ILogger<ResendEmailService> logger) : IEmailService
{
    public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)
    {
        var apiKey = configuration["Resend:ApiKey"]
            ?? throw new InvalidOperationException("Resend:ApiKey is not configured.");
        var fromAddress = configuration["Resend:FromAddress"]
            ?? throw new InvalidOperationException("Resend:FromAddress is not configured.");

        var payload = new
        {
            from = fromAddress,
            to = new[] { toEmail },
            subject = "Confirmá tu cuenta en ConferenceManager",
            html = $"""
                <p>Hola {toName},</p>
                <p>Hacé clic en el siguiente enlace para confirmar tu cuenta:</p>
                <p><a href="{verificationUrl}">Verificar mi cuenta</a></p>
                <p>Este enlace expira en 24 horas.</p>
                <p>Si no creaste una cuenta, ignorá este mensaje.</p>
                """
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var client = httpClientFactory.CreateClient("ResendClient");
        client.DefaultRequestHeaders.Clear();
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var response = await client.PostAsync("https://api.resend.com/emails", content);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            logger.LogError(
                "Resend API error. Status: {Status} | Body: {Body}",
                response.StatusCode, errorBody);
            throw new EmailDeliveryException(
                $"Failed to send verification email. Status: {response.StatusCode}");
        }
    }
}
