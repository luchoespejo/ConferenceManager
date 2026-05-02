using ConferenceManager.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace ConferenceManager.Tests;

public class QrServiceTests
{
    private readonly Mock<ILogger<QrService>> loggerMock;
    private readonly QrService qrService;

    public QrServiceTests()
    {
        loggerMock = new Mock<ILogger<QrService>>();
        qrService = new QrService(loggerMock.Object);
    }

    [Fact]
    public async Task GenerateAsync_ValidUrl_ReturnsBase64Data()
    {
        var url = "https://localhost:3000/s/123e4567-e89b-12d3-a456-426614174000";

        var result = await qrService.GenerateAsync(url);

        Assert.NotNull(result);
        Assert.StartsWith("data:image/png;base64,", result);
        Assert.True(result.Length > 100, "Base64 QR should have reasonable size");
    }

    [Fact]
    public async Task GenerateAsync_EmptyUrl_ReturnsBase64()
    {
        var url = "";

        var result = await qrService.GenerateAsync(url);

        Assert.NotNull(result);
        Assert.StartsWith("data:image/png;base64,", result);
    }

    [Fact]
    public async Task GenerateAsync_VeryLongUrl_ReturnsBase64()
    {
        var url = "https://localhost:3000/s/" + new string('a', 1000);

        var result = await qrService.GenerateAsync(url);

        Assert.NotNull(result);
        Assert.StartsWith("data:image/png;base64,", result);
    }
}
