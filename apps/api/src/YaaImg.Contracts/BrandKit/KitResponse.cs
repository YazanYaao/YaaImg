using System.Text.Json.Serialization;

namespace YaaImg.Contracts.BrandKit;

public class KitResponse
{
    [JsonPropertyName("brand_id")]
    public Guid BrandId { get; set; }

    [JsonPropertyName("brand_name")]
    public string BrandName { get; set; } = string.Empty;

    [JsonPropertyName("answers")]
    public KitAnswers Answers { get; set; } = new();

    [JsonPropertyName("summary")]
    public string? Summary { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("completed_at")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public DateTime UpdatedAt { get; set; }
}
