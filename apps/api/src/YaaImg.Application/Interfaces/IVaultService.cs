namespace YaaImg.Application.Interfaces;

public interface IVaultService
{
    Task<Guid> StoreSecretAsync(string secretValue, string name, CancellationToken ct = default);
    Task<string?> RetrieveSecretAsync(Guid secretId, CancellationToken ct = default);
    Task DeleteSecretAsync(Guid secretId, CancellationToken ct = default);
}
