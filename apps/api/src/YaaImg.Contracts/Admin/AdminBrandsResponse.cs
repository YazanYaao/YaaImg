using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Admin;

public class AdminBrandsResponse
{
    [JsonPropertyName("items")]
    public IReadOnlyList<AdminBrandItem> Items { get; set; } = [];

    [JsonPropertyName("total_count")]
    public int TotalCount { get; set; }
}
