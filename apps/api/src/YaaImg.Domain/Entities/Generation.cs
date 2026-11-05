namespace YaaImg.Domain.Entities;

public class Generation
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Prompt { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string PlatformPreset { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string LogoMode { get; set; } = "none";
    public string Status { get; set; } = "pending";
    public string? ProviderRequestId { get; set; }
    public string? ImagePath { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
