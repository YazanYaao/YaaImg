using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Admin;

public class AdminBrandItem
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("owner_user_id")]
    public Guid OwnerUserId { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("logo_url")]
    public string? LogoUrl { get; set; }

    [JsonPropertyName("kit_status")]
    public string KitStatus { get; set; } = "not_started";

    [JsonPropertyName("total_generations")]
    public int TotalGenerations { get; set; }

    [JsonPropertyName("succeeded_generations")]
    public int SucceededGenerations { get; set; }

    [JsonPropertyName("active_keys_count")]
    public int ActiveKeysCount { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime CreatedAt { get; set; }
}
