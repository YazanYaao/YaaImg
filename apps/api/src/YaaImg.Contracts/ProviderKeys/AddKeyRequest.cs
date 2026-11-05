using System.Text.Json.Serialization;

namespace YaaImg.Contracts.ProviderKeys;

public class AddKeyRequest
{
    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string? Label { get; set; }

    [JsonPropertyName("make_active")]
    public bool MakeActive { get; set; } = true;
}
