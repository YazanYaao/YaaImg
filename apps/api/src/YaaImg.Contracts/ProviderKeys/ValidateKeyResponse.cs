using System.Text.Json.Serialization;

namespace YaaImg.Contracts.ProviderKeys;

public class ValidateKeyResponse
{
    [JsonPropertyName("key_id")]
    public Guid KeyId { get; set; }

    [JsonPropertyName("valid")]
    public bool? Valid { get; set; }

    [JsonPropertyName("validated_at")]
    public DateTime? ValidatedAt { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}
