using YaaImg.Domain.Entities;

namespace YaaImg.Application.Interfaces;

public interface IGenerationRepository
{
    Task<Generation> InsertAsync(Generation generation, CancellationToken ct = default);
    Task UpdateStatusAsync(Guid id, string status, CancellationToken ct = default);
    Task MarkSucceededAsync(Guid id, string imagePath, string? providerRequestId, CancellationToken ct = default);
    Task MarkFailedAsync(Guid id, string errorCode, string? errorMessage, CancellationToken ct = default);
    Task<Generation?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Generation>> ListByBrandAsync(Guid brandId, int page, int perPage, string? provider, string? status, CancellationToken ct = default);
    Task<int> CountByBrandAsync(Guid brandId, string? provider, string? status, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}
