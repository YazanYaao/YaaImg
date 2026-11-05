namespace YaaImg.Application.Interfaces;

public interface IKeyValidationService
{
    Task<(bool? isValid, string? error)> ValidateAsync(string provider, string rawKey, CancellationToken ct = default);
}
