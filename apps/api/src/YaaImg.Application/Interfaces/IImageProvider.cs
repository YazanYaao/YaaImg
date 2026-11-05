namespace YaaImg.Application.Interfaces;

public record ProviderResult(byte[] ImageBytes, string? RequestId);

public interface IImageProvider
{
    Task<ProviderResult> GenerateOpenAiAsync(
        string apiKey,
        string prompt,
        int width,
        int height,
        string model,
        CancellationToken ct = default);

    Task<ProviderResult> GenerateGeminiAsync(
        string apiKey,
        string prompt,
        string aspectRatio,
        string model,
        CancellationToken ct = default);

    Task<ProviderResult> GenerateQwenAsync(
        string apiKey,
        string prompt,
        int width,
        int height,
        string model,
        CancellationToken ct = default);
}
