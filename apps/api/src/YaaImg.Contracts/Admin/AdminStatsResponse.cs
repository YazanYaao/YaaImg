using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Admin;

public class AdminStatsResponse
{
    [JsonPropertyName("total_brands")]
    public int TotalBrands { get; set; }

    [JsonPropertyName("total_users")]
    public int TotalUsers { get; set; }

    [JsonPropertyName("total_generations")]
    public int TotalGenerations { get; set; }

    [JsonPropertyName("succeeded_generations")]
    public int SucceededGenerations { get; set; }

    [JsonPropertyName("failed_generations")]
    public int FailedGenerations { get; set; }

    [JsonPropertyName("openai_generations")]
    public int OpenAiGenerations { get; set; }

    [JsonPropertyName("gemini_generations")]
    public int GeminiGenerations { get; set; }

    [JsonPropertyName("qwen_generations")]
    public int QwenGenerations { get; set; }

    [JsonPropertyName("active_openai_keys")]
    public int ActiveOpenAiKeys { get; set; }

    [JsonPropertyName("active_gemini_keys")]
    public int ActiveGeminiKeys { get; set; }

    [JsonPropertyName("active_qwen_keys")]
    public int ActiveQwenKeys { get; set; }

    [JsonPropertyName("success_rate")]
    public double SuccessRate => TotalGenerations > 0
        ? Math.Round((double)SucceededGenerations / TotalGenerations * 100, 1)
        : 0.0;
}
