using System.Text.Json.Serialization;

namespace YaaImg.Contracts.ProviderKeys;

public class KeyResponse
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("provider")]
    public string Provider { get; set; } = string.Empty;

    [JsonPropertyName("label")]
    public string? Label { get; set; }

    [JsonPropertyName("key_hint")]
    public string? KeyHint { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; }

    [JsonPropertyName("is_valid")]
    public bool? IsValid { get; set; }

    [JsonPropertyName("last_validated_at")]
    public DateTime? LastValidatedAt { get; set; }

    [JsonPropertyName("last_validation_error")]
    public string? LastValidationError { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}
