using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Infrastructure.Services;

public class AiImageProvider : IImageProvider
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<AiImageProvider> _logger;
    private readonly IConfiguration? _configuration;

    public AiImageProvider(
        HttpClient httpClient,
        ILogger<AiImageProvider> logger,
        IConfiguration? configuration = null)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
        _httpClient.Timeout = TimeSpan.FromSeconds(120);
    }

    public async Task<ProviderResult> GenerateOpenAiAsync(
        string apiKey,
        string prompt,
        int width,
        int height,
        string model,
        CancellationToken ct = default)
    {
        // OpenAI DALL-E 3 supports: 1024x1024, 1024x1792 (portrait), 1792x1024 (landscape)
        string size;
        if (Math.Abs(width - height) <= 100)
        {
            size = "1024x1024";
        }
        else if (height > width)
        {
            size = "1024x1792";
        }
        else
        {
            size = "1792x1024";
        }

        var payload = new
        {
            model = string.IsNullOrWhiteSpace(model) ? "dall-e-3" : model,
            prompt,
            size,
            response_format = "b64_json",
            n = 1
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/images/generations")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, ct);
        }
        catch (TaskCanceledException)
        {
            throw new ProviderException("OpenAI generation request timed out after 120 seconds.", "PROVIDER_TIMEOUT");
        }

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("OpenAI generation error ({Status}): {Body}", response.StatusCode, responseBody);
            var errorMessage = ExtractErrorMessage(responseBody) ?? $"OpenAI error: {response.StatusCode}";
            throw new ProviderException(errorMessage, "OPENAI_ERROR");
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            var dataArray = root.GetProperty("data");
            if (dataArray.GetArrayLength() == 0)
            {
                throw new ProviderException("OpenAI returned an empty image array.", "OPENAI_EMPTY_RESPONSE");
            }

            var b64 = dataArray[0].GetProperty("b64_json").GetString();
            if (string.IsNullOrWhiteSpace(b64))
            {
                throw new ProviderException("OpenAI image base64 data was empty.", "OPENAI_EMPTY_IMAGE");
            }

            var imageBytes = Convert.FromBase64String(b64);
            var requestId = response.Headers.TryGetValues("x-request-id", out var vals) ? vals.FirstOrDefault() : null;

            return new ProviderResult(imageBytes, requestId);
        }
        catch (Exception ex) when (ex is not ProviderException)
        {
            _logger.LogError(ex, "Failed to parse OpenAI generation response: {Body}", responseBody);
            throw new ProviderException("Unable to decode image from OpenAI response.", "OPENAI_PARSE_ERROR");
        }
    }

    public async Task<ProviderResult> GenerateGeminiAsync(
        string apiKey,
        string prompt,
        string aspectRatio,
        string model,
        CancellationToken ct = default)
    {
        var targetModel = string.IsNullOrWhiteSpace(model) ? "imagen-3.0-generate-002" : model;

        // Supported aspect ratios in Gemini: 1:1, 9:16, 16:9, 3:4, 4:3
        var validAspectRatio = aspectRatio switch
        {
            "9:16" => "9:16",
            "16:9" => "16:9",
            "3:4" => "3:4",
            "4:3" => "4:3",
            _ => "1:1"
        };

        // If using Imagen model, use predict endpoint; if using Gemini multimodal, use generateContent
        var isImagenModel = targetModel.Contains("imagen", StringComparison.OrdinalIgnoreCase);

        if (isImagenModel)
        {
            return await GenerateGeminiImagenPredictAsync(apiKey, prompt, validAspectRatio, targetModel, ct);
        }

        return await GenerateGeminiContentAsync(apiKey, prompt, validAspectRatio, targetModel, ct);
    }

    private async Task<ProviderResult> GenerateGeminiImagenPredictAsync(
        string apiKey,
        string prompt,
        string aspectRatio,
        string model,
        CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:predict?key={apiKey}";

        var payload = new
        {
            instances = new[]
            {
                new { prompt }
            },
            parameters = new
            {
                sampleCount = 1,
                aspectRatio,
                outputMimeType = "image/png"
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, ct);
        }
        catch (TaskCanceledException)
        {
            throw new ProviderException("Gemini generation request timed out after 120 seconds.", "PROVIDER_TIMEOUT");
        }

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini Imagen error ({Status}): {Body}", response.StatusCode, responseBody);
            var errorMessage = ExtractErrorMessage(responseBody) ?? $"Gemini error: {response.StatusCode}";
            throw new ProviderException(errorMessage, "GEMINI_ERROR");
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            if (root.TryGetProperty("predictions", out var predictions) && predictions.GetArrayLength() > 0)
            {
                var first = predictions[0];
                string? b64 = null;
                if (first.TryGetProperty("bytesBase64Encoded", out var b64Prop))
                {
                    b64 = b64Prop.GetString();
                }

                if (!string.IsNullOrWhiteSpace(b64))
                {
                    return new ProviderResult(Convert.FromBase64String(b64), null);
                }
            }

            throw new ProviderException("No image found in Gemini Imagen response.", "GEMINI_NO_IMAGE");
        }
        catch (Exception ex) when (ex is not ProviderException)
        {
            _logger.LogError(ex, "Failed to parse Gemini Imagen response: {Body}", responseBody);
            throw new ProviderException("Unable to decode image from Gemini response.", "GEMINI_PARSE_ERROR");
        }
    }

    private async Task<ProviderResult> GenerateGeminiContentAsync(
        string apiKey,
        string prompt,
        string aspectRatio,
        string model,
        CancellationToken ct)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var payload = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                responseModalities = new[] { "Image" },
                imageConfig = new
                {
                    aspectRatio
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, ct);
        }
        catch (TaskCanceledException)
        {
            throw new ProviderException("Gemini generation request timed out after 120 seconds.", "PROVIDER_TIMEOUT");
        }

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Gemini multimodal error ({Status}): {Body}", response.StatusCode, responseBody);
            var errorMessage = ExtractErrorMessage(responseBody) ?? $"Gemini error: {response.StatusCode}";
            throw new ProviderException(errorMessage, "GEMINI_ERROR");
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            var candidates = root.GetProperty("candidates");
            if (candidates.GetArrayLength() > 0)
            {
                var candidate = candidates[0];
                var parts = candidate.GetProperty("content").GetProperty("parts");
                foreach (var part in parts.EnumerateArray())
                {
                    if (part.TryGetProperty("inlineData", out var inlineData) &&
                        inlineData.TryGetProperty("data", out var dataProp))
                    {
                        var b64 = dataProp.GetString();
                        if (!string.IsNullOrWhiteSpace(b64))
                        {
                            var reqId = root.TryGetProperty("responseId", out var rId) ? rId.GetString() : null;
                            return new ProviderResult(Convert.FromBase64String(b64), reqId);
                        }
                    }
                }
            }

            throw new ProviderException("No inline image found in Gemini response.", "GEMINI_NO_IMAGE");
        }
        catch (Exception ex) when (ex is not ProviderException)
        {
            _logger.LogError(ex, "Failed to parse Gemini multimodal response: {Body}", responseBody);
            throw new ProviderException("Unable to decode image from Gemini response.", "GEMINI_PARSE_ERROR");
        }
    }

    public async Task<ProviderResult> GenerateQwenAsync(
        string apiKey,
        string prompt,
        int width,
        int height,
        string model,
        CancellationToken ct = default)
    {
        var targetModel = string.IsNullOrWhiteSpace(model) ? "qwen-image-2.1-turbo" : model.Trim();
        var primaryBase = _configuration?["DashScope:BaseUrl"]
            ?? _configuration?["DASHSCOPE_BASE_URL"]
            ?? Environment.GetEnvironmentVariable("DASHSCOPE_BASE_URL")
            ?? "https://ap-southeast-1.maas.qwencloudapi.com";

        var fallbackBase = _configuration?["DashScope:FallbackBaseUrl"]
            ?? "https://dashscope-intl.aliyuncs.com";

        var primaryRoot = primaryBase.Replace("/compatible-mode/v1", "").TrimEnd('/');
        var fallbackRoot = fallbackBase.Replace("/compatible-mode/v1", "").TrimEnd('/');

        // Resolve optimal native Qwen base resolution by aspect ratio
        string size;
        if (Math.Abs(width - height) <= 100)
        {
            size = "1024*1024";
        }
        else if (height > width)
        {
            size = "1152*2048";
        }
        else if (width >= height * 2.5)
        {
            size = width >= height * 3.5 ? "1536*384" : "1536*512";
        }
        else
        {
            size = (double)width / height >= 1.8 ? "1536*800" : "1536*864";
        }

        var payload = new
        {
            model = targetModel,
            input = new
            {
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        content = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            },
            parameters = new
            {
                size = size,
                prompt_extend = true
            }
        };

        var jsonContent = JsonSerializer.Serialize(payload);
        string activeRootUrl = primaryRoot;
        HttpResponseMessage response;

        try
        {
            var submitUrl = $"{activeRootUrl}/api/v1/services/aigc/multimodal-generation/generation";
            using var req = new HttpRequestMessage(HttpMethod.Post, submitUrl)
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            response = await _httpClient.SendAsync(req, ct);

            // If primary endpoint returned a gateway error (404, 502, 503), try fallback
            if (!response.IsSuccessStatusCode && primaryRoot != fallbackRoot &&
                (response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                 response.StatusCode == System.Net.HttpStatusCode.BadGateway ||
                 response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable))
            {
                _logger.LogWarning("Primary DashScope endpoint {Primary} returned status {Status}. Retrying with fallback {Fallback}.", primaryRoot, response.StatusCode, fallbackRoot);
                activeRootUrl = fallbackRoot;
                var fallbackSubmitUrl = $"{activeRootUrl}/api/v1/services/aigc/multimodal-generation/generation";
                using var fallbackReq = new HttpRequestMessage(HttpMethod.Post, fallbackSubmitUrl)
                {
                    Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
                };
                fallbackReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                response = await _httpClient.SendAsync(fallbackReq, ct);
            }
        }
        catch (HttpRequestException ex) when (primaryRoot != fallbackRoot)
        {
            _logger.LogWarning(ex, "Primary DashScope endpoint {Primary} failed with network/DNS error. Retrying with fallback {Fallback}.", primaryRoot, fallbackRoot);
            activeRootUrl = fallbackRoot;
            var fallbackSubmitUrl = $"{activeRootUrl}/api/v1/services/aigc/multimodal-generation/generation";
            using var fallbackReq = new HttpRequestMessage(HttpMethod.Post, fallbackSubmitUrl)
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };
            fallbackReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            response = await _httpClient.SendAsync(fallbackReq, ct);
        }
        catch (TaskCanceledException)
        {
            throw new ProviderException("Qwen generation request timed out after 120 seconds.", "PROVIDER_TIMEOUT");
        }

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Qwen generation error ({Status}): {Body}", response.StatusCode, responseBody);
            var errorMessage = ExtractErrorMessage(responseBody) ?? $"Qwen error: {response.StatusCode}";
            var errorCode = response.StatusCode switch
            {
                System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden => "INVALID_KEY",
                System.Net.HttpStatusCode.TooManyRequests => "RATE_LIMIT",
                _ => "QWEN_ERROR"
            };
            throw new ProviderException(errorMessage, errorCode);
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            var requestId = root.TryGetProperty("request_id", out var reqIdProp) ? reqIdProp.GetString() : null;

            if (root.TryGetProperty("output", out var outputObj))
            {
                // Synchronous choices output format: output.choices[0].message.content[0].image
                if (outputObj.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var firstChoice = choices[0];
                    if (firstChoice.TryGetProperty("message", out var msgObj) &&
                        msgObj.TryGetProperty("content", out var contentArray) &&
                        contentArray.GetArrayLength() > 0)
                    {
                        var firstContent = contentArray[0];
                        if (firstContent.TryGetProperty("image", out var imgProp))
                        {
                            var imgStr = imgProp.GetString();
                            if (!string.IsNullOrWhiteSpace(imgStr))
                            {
                                var imageBytes = imgStr.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                                    ? await _httpClient.GetByteArrayAsync(imgStr, ct)
                                    : Convert.FromBase64String(imgStr);
                                return new ProviderResult(imageBytes, requestId);
                            }
                        }
                    }
                }

                // Direct render_urls output format: output.render_urls[0]
                if (outputObj.TryGetProperty("render_urls", out var renderUrls) && renderUrls.GetArrayLength() > 0)
                {
                    var url = renderUrls[0].GetString();
                    if (!string.IsNullOrWhiteSpace(url))
                    {
                        var imageBytes = await _httpClient.GetByteArrayAsync(url, ct);
                        return new ProviderResult(imageBytes, requestId);
                    }
                }

                // Direct results output format: output.results[0].url
                if (outputObj.TryGetProperty("results", out var results) && results.GetArrayLength() > 0)
                {
                    var firstResult = results[0];
                    if (firstResult.TryGetProperty("url", out var urlProp))
                    {
                        var url = urlProp.GetString();
                        if (!string.IsNullOrWhiteSpace(url))
                        {
                            var imageBytes = await _httpClient.GetByteArrayAsync(url, ct);
                            return new ProviderResult(imageBytes, requestId);
                        }
                    }
                }

                // Asynchronous task_id format fallback
                if (outputObj.TryGetProperty("task_id", out var taskIdProp))
                {
                    var taskId = taskIdProp.GetString()!;
                    return await PollTaskAsync(activeRootUrl, fallbackRoot, taskId, apiKey, ct);
                }
            }

            throw new ProviderException("No image found in DashScope multimodal response.", "QWEN_NO_IMAGE");
        }
        catch (Exception ex) when (ex is not ProviderException)
        {
            _logger.LogError(ex, "Failed to parse DashScope response: {Body}", responseBody);
            throw new ProviderException("Unable to decode image from DashScope response.", "QWEN_PARSE_ERROR");
        }
    }

    private async Task<ProviderResult> PollTaskAsync(string rootUrl, string fallbackRootUrl, string taskId, string apiKey, CancellationToken ct)
    {
        var activeUrl = rootUrl;
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        while (stopwatch.Elapsed < TimeSpan.FromSeconds(120))
        {
            await Task.Delay(1500, ct);

            HttpResponseMessage pollResponse;
            try
            {
                using var pollRequest = new HttpRequestMessage(HttpMethod.Get, $"{activeUrl}/api/v1/tasks/{taskId}");
                pollRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                pollResponse = await _httpClient.SendAsync(pollRequest, ct);

                if (!pollResponse.IsSuccessStatusCode && activeUrl != fallbackRootUrl &&
                    (pollResponse.StatusCode == System.Net.HttpStatusCode.NotFound || pollResponse.StatusCode == System.Net.HttpStatusCode.BadGateway))
                {
                    activeUrl = fallbackRootUrl;
                    using var fallbackPoll = new HttpRequestMessage(HttpMethod.Get, $"{activeUrl}/api/v1/tasks/{taskId}");
                    fallbackPoll.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                    pollResponse = await _httpClient.SendAsync(fallbackPoll, ct);
                }
            }
            catch (HttpRequestException) when (activeUrl != fallbackRootUrl)
            {
                activeUrl = fallbackRootUrl;
                using var fallbackPoll = new HttpRequestMessage(HttpMethod.Get, $"{activeUrl}/api/v1/tasks/{taskId}");
                fallbackPoll.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                pollResponse = await _httpClient.SendAsync(fallbackPoll, ct);
            }

            var pollBody = await pollResponse.Content.ReadAsStringAsync(ct);
            if (!pollResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("DashScope task poll returned status {Status}: {Body}", pollResponse.StatusCode, pollBody);
                continue;
            }

            using var pollDoc = JsonDocument.Parse(pollBody);
            var pollRoot = pollDoc.RootElement;

            if (pollRoot.TryGetProperty("output", out var outputObj))
            {
                var status = outputObj.TryGetProperty("task_status", out var statusProp) ? statusProp.GetString() : null;

                if (status == "SUCCEEDED")
                {
                    if (outputObj.TryGetProperty("results", out var resultsArray) && resultsArray.GetArrayLength() > 0)
                    {
                        var firstResult = resultsArray[0];
                        if (firstResult.TryGetProperty("url", out var urlProp))
                        {
                            var imageUrl = urlProp.GetString();
                            if (!string.IsNullOrWhiteSpace(imageUrl))
                            {
                                var imageBytes = await _httpClient.GetByteArrayAsync(imageUrl, ct);
                                return new ProviderResult(imageBytes, taskId);
                            }
                        }
                    }

                    if (outputObj.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                    {
                        var choice = choices[0];
                        if (choice.TryGetProperty("message", out var m) &&
                            m.TryGetProperty("content", out var cArr) &&
                            cArr.GetArrayLength() > 0 &&
                            cArr[0].TryGetProperty("image", out var imgP))
                        {
                            var imgUrl = imgP.GetString();
                            if (!string.IsNullOrWhiteSpace(imgUrl))
                            {
                                var imageBytes = imgUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
                                    ? await _httpClient.GetByteArrayAsync(imgUrl, ct)
                                    : Convert.FromBase64String(imgUrl);
                                return new ProviderResult(imageBytes, taskId);
                            }
                        }
                    }

                    throw new ProviderException("DashScope task succeeded but returned no image URL.", "QWEN_EMPTY_RESPONSE");
                }
                else if (status == "FAILED" || status == "CANCELED")
                {
                    var msg = outputObj.TryGetProperty("message", out var mProp) ? mProp.GetString() : "Task failed";
                    throw new ProviderException($"Qwen generation failed: {msg}", "QWEN_ERROR");
                }
            }
        }

        throw new ProviderException("Qwen generation timed out waiting for task completion.", "PROVIDER_TIMEOUT");
    }

    private static string? ExtractErrorMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.TryGetProperty("message", out var directMsg))
            {
                return directMsg.GetString();
            }

            if (root.TryGetProperty("error", out var errorObj))
            {
                if (errorObj.ValueKind == JsonValueKind.String)
                {
                    return errorObj.GetString();
                }

                if (errorObj.TryGetProperty("message", out var msgProp))
                {
                    return msgProp.GetString();
                }
            }
        }
        catch
        {
            // Fall back to null if not JSON
        }

        return null;
    }
}
