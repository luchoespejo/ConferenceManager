using QRCoder;

namespace ConferenceManager.Services;

public class QrService : IQrService
{
    private readonly ILogger<QrService> logger;

    public QrService(ILogger<QrService> logger)
    {
        this.logger = logger;
    }

    public async Task<string?> GenerateAsync(string url)
    {
        return await Task.Run(() =>
        {
            try
            {
                using var qrGenerator = new QRCodeGenerator();
                var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q);

                using var qrCode = new PngByteQRCode(qrCodeData);
                var qrCodeImage = qrCode.GetGraphic(10);
                var base64 = Convert.ToBase64String(qrCodeImage);

                return $"data:image/png;base64,{base64}";
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to generate QR code for URL: {Url}", url);
                return null;
            }
        });
    }
}
