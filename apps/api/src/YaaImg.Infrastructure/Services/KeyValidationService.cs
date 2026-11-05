using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;

namespace YaaImg.Infrastructure.Services;

public class KeyValidationService : IKeyValidationService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<KeyValidationService> _logger;

    public KeyValidationService(HttpClient httpClient, ILogger<KeyValidationService> logger)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
        _logger = logger;
    }

    public async Task<(bool? isValid, string? error)> ValidateAsync(string provider, string rawKey, CancellationToken ct = default)
    {
        var normalized = provider?.Trim().ToLowerInvariant();

        return normalized switch
        {
            "openai" => await ValidateOpenAiKeyAsync(rawKey, ct),
            "gemini" => await ValidateGeminiKeyAsync(rawKey, ct),
            "qwen" => await ValidateQwenKeyAsync(rawKey, ct),
            _ => (false, $"Unsupported provider: {provider}")
        };
    }

    private async Task<(bool? isValid, string? error)> ValidateQwenKeyAsync(string rawKey, CancellationToken ct)
    {
        var primaryUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models";
        var fallbackUrl = "https://ap-southeast-1.maas.qwencloudapi.com/compatible-mode/v1/models";

        HttpResponseMessage response;
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, primaryUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", rawKey);
            response = await _httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.Unauthorized && response.StatusCode != HttpStatusCode.Forbidden)
            {
                // Try fallback if primary returned non-auth server error
                using var fallbackRequest = new HttpRequestMessage(HttpMethod.Get, fallbackUrl);
                fallbackRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", rawKey);
                var fallbackResponse = await _httpClient.SendAsync(fallbackRequest, ct);
                if (fallbackResponse.IsSuccessStatusCode || fallbackResponse.StatusCode == HttpStatusCode.Unauthorized)
                {
                    response.Dispose();
                    response = fallbackResponse;
                }
                else
                {
                    fallbackResponse.Dispose();
                }
            }
        }
        catch (HttpRequestException)
        {
            // Network or DNS error on primary, attempt fallback
            try
            {
                using var fallbackRequest = new HttpRequestMessage(HttpMethod.Get, fallbackUrl);
                fallbackRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", rawKey);
                response = await _httpClient.SendAsync(fallbackRequest, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Network error reaching DashScope API on both primary and fallback.");
                return (null, $"Network error reaching DashScope API: {ex.Message}");
            }
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Qwen key validation timed out.");
            return (null, "DashScope API unreachable (request timed out).");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Qwen key validation.");
            return (null, "Unexpected error during validation.");
        }

        try
        {
            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            var errorMessage = ExtractOpenAiErrorMessage(content) ?? $"Qwen DashScope returned status {(int)response.StatusCode}: {response.ReasonPhrase}";

            return (false, errorMessage);
        }
        finally
        {
            response?.Dispose();
        }
    }

    private async Task<(bool? isValid, string? error)> ValidateOpenAiKeyAsync(string rawKey, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "https://api.openai.com/v1/models/gpt-4o");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", rawKey);

        try
        {
            using var response = await _httpClient.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            var errorMessage = ExtractOpenAiErrorMessage(content) ?? $"OpenAI returned status {(int)response.StatusCode}: {response.ReasonPhrase}";

            if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.Forbidden)
            {
                return (false, errorMessage);
            }

            return (false, errorMessage);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "OpenAI key validation timed out.");
            return (null, "OpenAI API unreachable (request timed out).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Network error during OpenAI key validation.");
            return (null, $"Network error reaching OpenAI API: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during OpenAI key validation.");
            return (null, "Unexpected error during validation.");
        }
    }

    private async Task<(bool? isValid, string? error)> ValidateGeminiKeyAsync(string rawKey, CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash?key={Uri.EscapeDataString(rawKey)}";
        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        try
        {
            using var response = await _httpClient.SendAsync(request, ct);

            if (response.IsSuccessStatusCode)
            {
                return (true, null);
            }

            var content = await response.Content.ReadAsStringAsync(ct);
            var errorMessage = ExtractGeminiErrorMessage(content) ?? $"Gemini returned status {(int)response.StatusCode}: {response.ReasonPhrase}";

            return (false, errorMessage);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Gemini key validation timed out.");
            return (null, "Gemini API unreachable (request timed out).");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Network error during Gemini key validation.");
            return (null, $"Network error reaching Gemini API: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during Gemini key validation.");
            return (null, "Unexpected error during validation.");
        }
    }

    private static string? ExtractOpenAiErrorMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error", out var errorElement) &&
                errorElement.TryGetProperty("message", out var messageElement))
            {
                return messageElement.GetString();
            }
        }
        catch
        {
            // Ignore parse failures
        }

        return null;
    }

    private static string? ExtractGeminiErrorMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error", out var errorElement) &&
                errorElement.TryGetProperty("message", out var messageElement))
            {
                return messageElement.GetString();
            }
        }
        catch
        {
            // Ignore parse failures
        }

        return null;
    }
}
