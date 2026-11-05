using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.ProviderKeys;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Application.Services;

public class ProviderKeyService
{
    private readonly IProviderKeyRepository _providerKeyRepository;
    private readonly IBrandRepository _brandRepository;
    private readonly IVaultService _vaultService;
    private readonly IKeyValidationService _keyValidationService;
    private readonly ILogger<ProviderKeyService> _logger;

    private static readonly HashSet<string> SupportedProviders = new(StringComparer.OrdinalIgnoreCase)
    {
        "openai",
        "gemini",
        "qwen"
    };

    private const int MaxKeysPerProvider = 3;

    public ProviderKeyService(
        IProviderKeyRepository providerKeyRepository,
        IBrandRepository brandRepository,
        IVaultService vaultService,
        IKeyValidationService keyValidationService,
        ILogger<ProviderKeyService> logger)
    {
        _providerKeyRepository = providerKeyRepository;
        _brandRepository = brandRepository;
        _vaultService = vaultService;
        _keyValidationService = keyValidationService;
        _logger = logger;
    }

    public async Task<KeyListResponse> ListKeysAsync(Guid brandId, Guid userId, CancellationToken ct = default)
    {
        await EnsureBrandOwnershipAsync(brandId, userId, ct);

        var keys = await _providerKeyRepository.ListByBrandAsync(brandId, ct);
        return new KeyListResponse
        {
            Keys = keys.Select(MapToResponse).ToList()
        };
    }

    public async Task<KeyResponse> AddKeyAsync(Guid brandId, Guid userId, AddKeyRequest request, CancellationToken ct = default)
    {
        await EnsureBrandOwnershipAsync(brandId, userId, ct);

        var provider = request.Provider?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!SupportedProviders.Contains(provider))
        {
            throw new ValidationException("Provider must be 'openai', 'gemini', or 'qwen'.", "INVALID_PROVIDER");
        }

        var rawKey = request.Key?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(rawKey))
        {
            throw new ValidationException("API key is required.", "EMPTY_KEY");
        }

        var label = request.Label?.Trim();
        if (label is not null && label.Length > 100)
        {
            throw new ValidationException("Label cannot exceed 100 characters.", "LABEL_TOO_LONG");
        }

        var currentKeyCount = await _providerKeyRepository.CountByBrandAndProviderAsync(brandId, provider, ct);
        if (currentKeyCount >= MaxKeysPerProvider)
        {
            throw new ValidationException($"Maximum limit of {MaxKeysPerProvider} keys per provider has been reached for this brand.", "KEY_LIMIT_EXCEEDED");
        }

        // Store secret in Supabase Vault
        var secretName = $"brands/{brandId}/{provider}/{Guid.NewGuid():N}";
        var vaultSecretId = await _vaultService.StoreSecretAsync(rawKey, secretName, ct);

        // Derive key_hint: last 4 alphanumeric characters (must match ^[A-Za-z0-9_-]{2,16}$)
        var cleanChars = rawKey.Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '-').ToArray();
        var keyHint = cleanChars.Length >= 2
            ? new string(cleanChars.TakeLast(4).ToArray())
            : "key1";

        // First key for provider auto-activates regardless of toggle; otherwise respect MakeActive
        var shouldBeActive = currentKeyCount == 0 || request.MakeActive;

        var keyEntity = new ProviderKey
        {
            Id = Guid.NewGuid(),
            BrandId = brandId,
            Provider = provider,
            VaultSecretId = vaultSecretId,
            Label = string.IsNullOrWhiteSpace(label) ? null : label,
            KeyHint = keyHint,
            IsActive = currentKeyCount == 0 && shouldBeActive, // If count == 0, can insert directly as active
            IsValid = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _providerKeyRepository.CreateAsync(keyEntity, ct);

        // If not first key but user wants it active, atomically deactivate old active and activate this one
        if (currentKeyCount > 0 && shouldBeActive)
        {
            await _providerKeyRepository.ActivateKeyAsync(brandId, created.Id, provider, ct);
            created.IsActive = true;
        }

        return MapToResponse(created);
    }

    public async Task<KeyResponse> ActivateKeyAsync(Guid brandId, Guid keyId, Guid userId, CancellationToken ct = default)
    {
        await EnsureBrandOwnershipAsync(brandId, userId, ct);

        var key = await _providerKeyRepository.GetByIdAsync(keyId, ct);
        if (key is null || key.BrandId != brandId)
        {
            throw new NotFoundException("Provider key not found.", "KEY_NOT_FOUND");
        }

        await _providerKeyRepository.ActivateKeyAsync(brandId, keyId, key.Provider, ct);

        var updated = await _providerKeyRepository.GetByIdAsync(keyId, ct);
        return MapToResponse(updated ?? key);
    }

    public async Task<ValidateKeyResponse> ValidateKeyAsync(Guid brandId, Guid keyId, Guid userId, CancellationToken ct = default)
    {
        await EnsureBrandOwnershipAsync(brandId, userId, ct);

        var key = await _providerKeyRepository.GetByIdAsync(keyId, ct);
        if (key is null || key.BrandId != brandId)
        {
            throw new NotFoundException("Provider key not found.", "KEY_NOT_FOUND");
        }

        var rawKey = await _vaultService.RetrieveSecretAsync(key.VaultSecretId, ct);
        if (string.IsNullOrWhiteSpace(rawKey))
        {
            throw new ValidationException("Secret key could not be retrieved from vault.", "VAULT_SECRET_NOT_FOUND");
        }

        var (isValid, error) = await _keyValidationService.ValidateAsync(key.Provider, rawKey, ct);
        await _providerKeyRepository.UpdateValidationAsync(keyId, isValid, error, ct);

        return new ValidateKeyResponse
        {
            KeyId = keyId,
            Valid = isValid,
            ValidatedAt = DateTime.UtcNow,
            Error = error
        };
    }

    public async Task DeleteKeyAsync(Guid brandId, Guid keyId, Guid userId, CancellationToken ct = default)
    {
        await EnsureBrandOwnershipAsync(brandId, userId, ct);

        var key = await _providerKeyRepository.GetByIdAsync(keyId, ct);
        if (key is null || key.BrandId != brandId)
        {
            throw new NotFoundException("Provider key not found.", "KEY_NOT_FOUND");
        }

        // Delete Vault secret (best-effort)
        try
        {
            await _vaultService.DeleteSecretAsync(key.VaultSecretId, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete vault secret {VaultSecretId} for provider key {KeyId}", key.VaultSecretId, keyId);
        }

        await _providerKeyRepository.DeleteAsync(keyId, ct);
    }

    private async Task EnsureBrandOwnershipAsync(Guid brandId, Guid userId, CancellationToken ct)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }
    }

    private static KeyResponse MapToResponse(ProviderKey key)
    {
        return new KeyResponse
        {
            Id = key.Id,
            Provider = key.Provider,
            Label = key.Label,
            KeyHint = !string.IsNullOrEmpty(key.KeyHint) ? $"***{key.KeyHint}" : null,
            IsActive = key.IsActive,
            IsValid = key.IsValid,
            LastValidatedAt = key.LastValidatedAt,
            LastValidationError = key.LastValidationError,
            CreatedAt = key.CreatedAt
        };
    }
}
