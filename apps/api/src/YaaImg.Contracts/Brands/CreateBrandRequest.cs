using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace YaaImg.Contracts.Brands;

public class CreateBrandRequest
{
    [Required]
    [StringLength(120, MinimumLength = 2, ErrorMessage = "Brand name must be between 2 and 120 characters.")]
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}
