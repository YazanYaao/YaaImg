namespace YaaImg.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(string path, Stream stream, string contentType, CancellationToken ct = default);
    Task<byte[]?> DownloadAsync(string path, CancellationToken ct = default);
    Task DeleteAsync(string path, CancellationToken ct = default);
    string GetPublicUrl(string? path);
}
