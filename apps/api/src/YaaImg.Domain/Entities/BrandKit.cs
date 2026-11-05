namespace YaaImg.Domain.Entities;

public class BrandKit
{
    public Guid BrandId { get; set; }
    public string? Tagline { get; set; }
    public string? Tone { get; set; }
    public string? Audience { get; set; }
    public string[] Colors { get; set; } = Array.Empty<string>();
    public string? AvoidWords { get; set; }
    public string? Summary { get; set; }
    public string Status { get; set; } = "not_started";
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
