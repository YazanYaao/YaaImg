using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Generations;

public class PagedGenerationsResponse
{
    [JsonPropertyName("items")]
    public IReadOnlyList<GenerationResponse> Items { get; set; } = [];

    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("per_page")]
    public int PerPage { get; set; }

    [JsonPropertyName("total_pages")]
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Math.Max(PerPage, 1));
}
