using YaaImg.Contracts.Admin;

namespace YaaImg.Application.Interfaces;

public class AdminBrandRow
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoPath { get; set; }
    public string KitStatus { get; set; } = "not_started";
    public int TotalGenerations { get; set; }
    public int SucceededGenerations { get; set; }
    public int ActiveKeysCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface IAdminRepository
{
    Task<AdminStatsResponse> GetStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminBrandRow>> GetAllBrandsAsync(CancellationToken ct = default);
}
