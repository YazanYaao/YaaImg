using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;

namespace YaaImg.Infrastructure.Services;

public class SupabaseStorageService : IStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;
    private readonly string? _serviceRoleKey;
    private readonly string? _secretKey;
    private readonly string? _anonKey;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<SupabaseStorageService> _logger;
    private const string BucketName = "brand-assets";

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        IHttpContextAccessor httpContextAccessor,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;

        _baseUrl = configuration["Supabase:Url"]
            ?? configuration["SUPABASE_URL"]
            ?? throw new InvalidOperationException("Supabase URL is not configured.");

        _serviceRoleKey = configuration["Supabase:ServiceRoleKey"]
            ?? configuration["SUPABASE_SERVICE_ROLE_KEY"];

        _secretKey = configuration["Supabase:SecretKey"]
            ?? configuration["SUPABASE_SECRET_KEY"];

        _anonKey = configuration["Supabase:AnonKey"]
            ?? configuration["SUPABASE_ANON_KEY"]
            ?? configuration["SUPABASE_PUBLISHABLE_KEY"]
            ?? configuration["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
    }

    public async Task<string> UploadAsync(string path, Stream stream, string contentType, CancellationToken ct = default)
    {
        var cleanPath = path.TrimStart('/');
        var requestUrl = $"{_baseUrl.TrimEnd('/')}/storage/v1/object/{BucketName}/{cleanPath}";

        using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
        ApplyAuthHeaders(request);

        request.Headers.Add("x-upsert", "true");

        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Content = content;

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Failed to upload file to Supabase Storage at {Path}. Status: {StatusCode}, Body: {Body}",
                cleanPath, response.StatusCode, errorBody);
            throw new InvalidOperationException($"Storage upload failed with status code {response.StatusCode}: {errorBody}");
        }

        return cleanPath;
    }

    public async Task<byte[]?> DownloadAsync(string path, CancellationToken ct = default)
    {
        var cleanPath = path.TrimStart('/');
        var requestUrl = $"{_baseUrl.TrimEnd('/')}/storage/v1/object/public/{BucketName}/{cleanPath}";

        try
        {
            var response = await _httpClient.GetAsync(requestUrl, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Download from Supabase Storage returned non-success status {Status} for {Path}",
                    response.StatusCode, cleanPath);
                return null;
            }

            return await response.Content.ReadAsByteArrayAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while downloading file from storage at {Path}", cleanPath);
            return null;
        }
    }

    public async Task DeleteAsync(string path, CancellationToken ct = default)
    {
        var cleanPath = path.TrimStart('/');
        var requestUrl = $"{_baseUrl.TrimEnd('/')}/storage/v1/object/{BucketName}/{cleanPath}";

        using var request = new HttpRequestMessage(HttpMethod.Delete, requestUrl);
        ApplyAuthHeaders(request);

        var response = await _httpClient.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogWarning("Delete from Supabase Storage returned non-success for {Path}. Status: {StatusCode}, Body: {Body}",
                cleanPath, response.StatusCode, errorBody);
        }
    }

    public string GetPublicUrl(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return string.Empty;
        }

        var cleanPath = path.TrimStart('/');
        return $"{_baseUrl.TrimEnd('/')}/storage/v1/object/public/{BucketName}/{cleanPath}";
    }

    private void ApplyAuthHeaders(HttpRequestMessage request)
    {
        // 1. Determine apikey to send
        var apiKey = _serviceRoleKey ?? _secretKey ?? _anonKey;
        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            request.Headers.Add("apikey", apiKey);
        }

        // 2. Determine Authorization Bearer token:
        // Case A: Service Role key is a valid JWT (starts with ey and contains at least 2 dots)
        if (IsCompactJws(_serviceRoleKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
            return;
        }

        // Case B: Secret key is a valid JWT
        if (IsCompactJws(_secretKey))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _secretKey);
            return;
        }

        // Case C: Forward the current user's authenticated Bearer token from the incoming HTTP request
        var incomingAuth = _httpContextAccessor?.HttpContext?.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrWhiteSpace(incomingAuth) && incomingAuth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var userJwt = incomingAuth["Bearer ".Length..].Trim();
            if (IsCompactJws(userJwt))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", userJwt);
                return;
            }
        }
    }

    private static bool IsCompactJws(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        return token.StartsWith("ey", StringComparison.OrdinalIgnoreCase) && token.Count(c => c == '.') >= 2;
    }
}
