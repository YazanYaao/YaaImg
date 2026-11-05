using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Generations;

public class GenerateRequest
{
    [JsonPropertyName("prompt")]
    public string Prompt { get; set; } = string.Empty;

    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("model")]
    public string? Model { get; set; }

    [JsonPropertyName("platform_preset")]
    public string PlatformPreset { get; set; } = string.Empty;

    [JsonPropertyName("logo_mode")]
    public string LogoMode { get; set; } = "none";

    [JsonPropertyName("include_brand_context")]
    public bool IncludeBrandContext { get; set; } = true;
}
