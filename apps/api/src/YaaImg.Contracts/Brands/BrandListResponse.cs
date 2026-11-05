using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Brands;

public class BrandListResponse
{
    [JsonPropertyName("brands")]
    public List<BrandResponse> Brands { get; set; } = new();
}
