namespace YaaImg.Domain.Entities;

public class ProviderKey
{
    public Guid Id { get; set; }
    public Guid BrandId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public Guid VaultSecretId { get; set; }
    public string? Label { get; set; }
    public string? KeyHint { get; set; }
    public bool IsActive { get; set; }
    public bool? IsValid { get; set; }
    public DateTime? LastValidatedAt { get; set; }
    public string? LastValidationError { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
