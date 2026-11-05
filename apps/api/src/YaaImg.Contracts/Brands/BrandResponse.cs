using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Brands;

public class BrandResponse
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("logo_url")]
    public string? LogoUrl { get; set; }

    [JsonPropertyName("kit_status")]
    public string KitStatus { get; set; } = "not_started";

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}
