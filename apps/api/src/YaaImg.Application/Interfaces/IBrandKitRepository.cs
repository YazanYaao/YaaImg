using YaaImg.Domain.Entities;

namespace YaaImg.Application.Interfaces;

public interface IBrandKitRepository
{
    Task<BrandKit?> GetByBrandIdAsync(Guid brandId, CancellationToken ct = default);
    Task<BrandKit> UpsertAsync(BrandKit kit, CancellationToken ct = default);
}
