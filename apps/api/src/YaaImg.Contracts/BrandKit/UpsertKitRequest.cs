using System.Text.Json.Serialization;

namespace YaaImg.Contracts.BrandKit;

public class KitAnswers
{
    [JsonPropertyName("tagline")]
    public string? Tagline { get; set; }

    [JsonPropertyName("tone")]
    public string? Tone { get; set; }

    [JsonPropertyName("audience")]
    public string? Audience { get; set; }

    [JsonPropertyName("colors")]
    public string[]? Colors { get; set; }

    [JsonPropertyName("avoid_words")]
    public string? AvoidWords { get; set; }
}

public class UpsertKitRequest
{
    [JsonPropertyName("answers")]
    public KitAnswers Answers { get; set; } = new();
}
