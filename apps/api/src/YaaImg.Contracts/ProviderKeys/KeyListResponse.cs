using System.Text.Json.Serialization;

namespace YaaImg.Contracts.ProviderKeys;

public class KeyListResponse
{
    [JsonPropertyName("keys")]
    public List<KeyResponse> Keys { get; set; } = new();
}
