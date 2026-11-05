using YaaImg.Domain.Entities;

namespace YaaImg.Application.Interfaces;

public interface IBrandRepository
{
    Task<IReadOnlyList<Brand>> ListByOwnerAsync(Guid userId, CancellationToken ct = default);
    Task<Brand?> GetByIdAsync(Guid brandId, CancellationToken ct = default);
    Task<Brand> CreateAsync(Brand brand, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid brandId, CancellationToken ct = default);
    Task<bool> UpdateLogoPathAsync(Guid brandId, string? logoPath, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetImagePathsByBrandIdAsync(Guid brandId, CancellationToken ct = default);
}
