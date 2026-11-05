using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.Brands;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Application.Services;

public class BrandService
{
    private readonly IBrandRepository _brandRepository;
    private readonly IStorageService _storageService;
    private readonly IProviderKeyRepository _providerKeyRepository;
    private readonly IVaultService _vaultService;
    private readonly ILogger<BrandService> _logger;

    private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    };

    private const long MaxLogoSizeBytes = 5 * 1024 * 1024; // 5MB

    public BrandService(
        IBrandRepository brandRepository,
        IStorageService storageService,
        IProviderKeyRepository providerKeyRepository,
        IVaultService vaultService,
        ILogger<BrandService> logger)
    {
        _brandRepository = brandRepository;
        _storageService = storageService;
        _providerKeyRepository = providerKeyRepository;
        _vaultService = vaultService;
        _logger = logger;
    }

    public async Task<BrandListResponse> ListBrandsAsync(Guid userId, CancellationToken ct = default)
    {
        var brands = await _brandRepository.ListByOwnerAsync(userId, ct);
        return new BrandListResponse
        {
            Brands = brands.Select(MapToResponse).ToList()
        };
    }

    public async Task<BrandResponse> GetBrandAsync(Guid brandId, Guid userId, CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        return MapToResponse(brand);
    }

    public async Task<BrandResponse> CreateBrandAsync(Guid userId, CreateBrandRequest request, CancellationToken ct = default)
    {
        var trimmedName = request.Name?.Trim() ?? string.Empty;
        if (trimmedName.Length < 2 || trimmedName.Length > 120)
        {
            throw new ValidationException("Brand name must be between 2 and 120 characters.", "INVALID_NAME");
        }

        var brand = new Brand
        {
            Id = Guid.NewGuid(),
            OwnerUserId = userId,
            Name = trimmedName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _brandRepository.CreateAsync(brand, ct);
        return MapToResponse(created);
    }

    public async Task DeleteBrandAsync(Guid brandId, Guid userId, CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        // 1. Get and delete generation images from storage
        try
        {
            var imagePaths = await _brandRepository.GetImagePathsByBrandIdAsync(brandId, ct);
            foreach (var path in imagePaths)
            {
                try
                {
                    await _storageService.DeleteAsync(path, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete generation image at {Path}", path);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve generation images for brand {BrandId}", brandId);
        }

        // 2. Delete brand logo from storage if present
        if (!string.IsNullOrWhiteSpace(brand.LogoPath))
        {
            try
            {
                await _storageService.DeleteAsync(brand.LogoPath, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete logo for brand {BrandId}", brandId);
            }
        }

        // 3. Delete Vault secrets for all provider keys
        try
        {
            var keys = await _providerKeyRepository.ListByBrandAsync(brandId, ct);
            foreach (var key in keys)
            {
                try
                {
                    await _vaultService.DeleteSecretAsync(key.VaultSecretId, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete vault secret {SecretId} for provider key {KeyId}", key.VaultSecretId, key.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to retrieve provider keys for brand {BrandId} during brand deletion", brandId);
        }

        // 4. Delete brand from DB (cascades brand_kits, provider_keys, generations)
        await _brandRepository.DeleteAsync(brandId, ct);
    }

    public async Task<BrandResponse> UploadLogoAsync(
        Guid brandId,
        Guid userId,
        Stream fileStream,
        string contentType,
        string fileName,
        long fileSize,
        CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        if (fileSize > MaxLogoSizeBytes)
        {
            throw new ValidationException("Logo file size must be less than or equal to 5MB.", "FILE_TOO_LARGE");
        }

        if (string.IsNullOrWhiteSpace(contentType) || !AllowedMimeTypes.Contains(contentType))
        {
            throw new ValidationException("Only PNG, JPEG, and WebP images are allowed.", "INVALID_FILE_TYPE");
        }

        var extension = GetExtension(contentType, fileName);
        var storagePath = $"brands/{brandId}/logo.{extension}";

        await _storageService.UploadAsync(storagePath, fileStream, contentType, ct);
        await _brandRepository.UpdateLogoPathAsync(brandId, storagePath, ct);

        brand.LogoPath = storagePath;
        return MapToResponse(brand);
    }

    public async Task<BrandResponse> DeleteLogoAsync(Guid brandId, Guid userId, CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        if (!string.IsNullOrWhiteSpace(brand.LogoPath))
        {
            try
            {
                await _storageService.DeleteAsync(brand.LogoPath, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete logo from storage for brand {BrandId}", brandId);
            }

            await _brandRepository.UpdateLogoPathAsync(brandId, null, ct);
            brand.LogoPath = null;
        }

        return MapToResponse(brand);
    }

    private BrandResponse MapToResponse(Brand brand)
    {
        return new BrandResponse
        {
            Id = brand.Id,
            Name = brand.Name,
            LogoUrl = _storageService.GetPublicUrl(brand.LogoPath),
            KitStatus = brand.KitStatus ?? "not_started",
            CreatedAt = brand.CreatedAt
        };
    }

    private static string GetExtension(string contentType, string fileName)
    {
        return contentType.ToLowerInvariant() switch
        {
            "image/png" => "png",
            "image/jpeg" or "image/jpg" => "jpg",
            "image/webp" => "webp",
            _ => Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant() switch
            {
                "png" => "png",
                "jpg" or "jpeg" => "jpg",
                "webp" => "webp",
                _ => "png"
            }
        };
    }
}
