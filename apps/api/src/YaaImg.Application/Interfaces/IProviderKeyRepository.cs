using YaaImg.Domain.Entities;

namespace YaaImg.Application.Interfaces;

public interface IProviderKeyRepository
{
    Task<IReadOnlyList<ProviderKey>> ListByBrandAsync(Guid brandId, CancellationToken ct = default);
    Task<ProviderKey?> GetByIdAsync(Guid keyId, CancellationToken ct = default);
    Task<ProviderKey> CreateAsync(ProviderKey key, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid keyId, CancellationToken ct = default);
    Task ActivateKeyAsync(Guid brandId, Guid keyId, string provider, CancellationToken ct = default);
    Task UpdateValidationAsync(Guid keyId, bool? isValid, string? error, CancellationToken ct = default);
    Task<int> CountByBrandAndProviderAsync(Guid brandId, string provider, CancellationToken ct = default);
    Task<ProviderKey?> GetActiveAsync(Guid brandId, string provider, CancellationToken ct = default);
    Task MarkUsedAsync(Guid keyId, CancellationToken ct = default);
}
