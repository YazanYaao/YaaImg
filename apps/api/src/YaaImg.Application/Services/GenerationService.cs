using Microsoft.Extensions.Logging;
using YaaImg.Application.Common;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.Generations;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Application.Services;

public class GenerationService
{
    private readonly IBrandRepository _brandRepository;
    private readonly IProviderKeyRepository _keyRepository;
    private readonly IBrandKitRepository _brandKitRepository;
    private readonly IGenerationRepository _generationRepository;
    private readonly IVaultService _vaultService;
    private readonly IImageProvider _imageProvider;
    private readonly IImageProcessor _imageProcessor;
    private readonly IStorageService _storageService;
    private readonly ILogger<GenerationService> _logger;

    public GenerationService(
        IBrandRepository brandRepository,
        IProviderKeyRepository keyRepository,
        IBrandKitRepository brandKitRepository,
        IGenerationRepository generationRepository,
        IVaultService vaultService,
        IImageProvider imageProvider,
        IImageProcessor imageProcessor,
        IStorageService storageService,
        ILogger<GenerationService> logger)
    {
        _brandRepository = brandRepository;
        _keyRepository = keyRepository;
        _brandKitRepository = brandKitRepository;
        _generationRepository = generationRepository;
        _vaultService = vaultService;
        _imageProvider = imageProvider;
        _imageProcessor = imageProcessor;
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<GenerationResponse> GenerateImageAsync(
        Guid brandId,
        Guid userId,
        GenerateRequest request,
        CancellationToken ct = default)
    {
        // 1. Verify brand ownership
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        // 2. Validate prompt
        var cleanPrompt = request.Prompt?.Trim() ?? string.Empty;
        if (cleanPrompt.Length < 3 || cleanPrompt.Length > 4000)
        {
            throw new ValidationException("Prompt must be between 3 and 4000 characters.", "INVALID_PROMPT");
        }

        // 3. Resolve preset
        var preset = PlatformPresets.Get(request.PlatformPreset);
        if (preset is null)
        {
            throw new ValidationException($"Invalid platform preset '{request.PlatformPreset}'.", "INVALID_PRESET");
        }

        // 4. Resolve provider and model (Standardized on Qwen)
        var requestedProvider = request.Provider?.Trim().ToLowerInvariant();
        var provider = "qwen"; // Default and standardize on Qwen

        if (requestedProvider == "openai" || requestedProvider == "gemini")
        {
            _logger.LogInformation("Legacy provider '{LegacyProvider}' requested; defaulting to 'qwen'", requestedProvider);
        }

        var model = request.Model?.Trim();
        if (string.IsNullOrWhiteSpace(model) || (model != "qwen-image-2.1-turbo" && model != "qwen-image-2.1-pro"))
        {
            model = "qwen-image-2.1-turbo";
        }

        // 5. Validate logo mode
        var logoMode = string.IsNullOrWhiteSpace(request.LogoMode) ? "none" : request.LogoMode.Trim().ToLowerInvariant();
        if (logoMode != "none" && logoMode != "prompt" && logoMode != "watermark" && logoMode != "both")
        {
            logoMode = "none";
        }

        // 6. Retrieve active key
        var activeKey = await _keyRepository.GetActiveAsync(brandId, provider, ct);
        if (activeKey is null)
        {
            throw new ValidationException($"No active {provider} API key configured for this brand.", "NO_ACTIVE_KEY");
        }

        // 7. Insert pending generation record
        var generationId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var generation = new Generation
        {
            Id = generationId,
            BrandId = brandId,
            Prompt = cleanPrompt,
            Provider = provider,
            Model = model,
            PlatformPreset = preset.Key,
            Width = preset.Width,
            Height = preset.Height,
            LogoMode = logoMode,
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        await _generationRepository.InsertAsync(generation, ct);

        try
        {
            // 8. Update to processing
            await _generationRepository.UpdateStatusAsync(generationId, "processing", ct);

            // 9. Build enriched prompt
            var promptParts = new List<string>();

            if (request.IncludeBrandContext)
            {
                var kit = await _brandKitRepository.GetByBrandIdAsync(brandId, ct);
                if (kit?.Summary is not null && !string.IsNullOrWhiteSpace(kit.Summary))
                {
                    promptParts.Add($"Brand Identity Context:\n{kit.Summary}");
                }
            }

            if ((logoMode == "prompt" || logoMode == "both") && !string.IsNullOrWhiteSpace(brand.LogoPath))
            {
                promptParts.Add("Incorporate the brand logo naturally and tastefully into the scene.");
            }

            promptParts.Add($"Image Request:\n{cleanPrompt}");
            var fullPrompt = string.Join("\n\n", promptParts);

            // 10. Retrieve raw API key from vault
            var rawApiKey = await _vaultService.RetrieveSecretAsync(activeKey.VaultSecretId, ct);
            if (string.IsNullOrWhiteSpace(rawApiKey))
            {
                throw new ValidationException("Unable to retrieve secret API key from vault.", "VAULT_SECRET_NOT_FOUND");
            }

            // 11. Call AI Provider
            ProviderResult result;
            if (provider == "openai")
            {
                result = await _imageProvider.GenerateOpenAiAsync(rawApiKey, fullPrompt, preset.Width, preset.Height, model, ct);
            }
            else if (provider == "gemini")
            {
                result = await _imageProvider.GenerateGeminiAsync(rawApiKey, fullPrompt, preset.AspectRatio, model, ct);
            }
            else
            {
                result = await _imageProvider.GenerateQwenAsync(rawApiKey, fullPrompt, preset.Width, preset.Height, model, ct);
            }

            // Clear key reference
            rawApiKey = null;

            // 12. Post-process: resize to exact target dimensions
            var processedBytes = _imageProcessor.ResizeToPreset(result.ImageBytes, preset.Width, preset.Height);

            // 13. Apply watermark if requested and logo exists
            if ((logoMode == "watermark" || logoMode == "both") && !string.IsNullOrWhiteSpace(brand.LogoPath))
            {
                try
                {
                    var logoBytes = await _storageService.DownloadAsync(brand.LogoPath, ct);
                    if (logoBytes is { Length: > 0 })
                    {
                        processedBytes = _imageProcessor.ApplyWatermark(processedBytes, logoBytes);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to apply logo watermark for generation {GenerationId}; continuing with un-watermarked image", generationId);
                }
            }

            // 14. Upload to Supabase Storage
            var imagePath = $"brands/{brandId:D}/generations/{generationId:D}.png";
            using var stream = new MemoryStream(processedBytes);
            await _storageService.UploadAsync(imagePath, stream, "image/png", ct);

            // 15. Mark succeeded
            await _generationRepository.MarkSucceededAsync(generationId, imagePath, result.RequestId, ct);

            // 16. Update key last_used_at
            await _keyRepository.MarkUsedAsync(activeKey.Id, ct);

            var completedAt = DateTime.UtcNow;
            return new GenerationResponse
            {
                Id = generationId,
                BrandId = brandId,
                Prompt = cleanPrompt,
                Provider = provider,
                Model = model,
                PlatformPreset = preset.Key,
                Width = preset.Width,
                Height = preset.Height,
                LogoMode = logoMode,
                Status = "succeeded",
                ImageUrl = _storageService.GetPublicUrl(imagePath),
                ErrorCode = null,
                CreatedAt = now,
                CompletedAt = completedAt
            };
        }
        catch (ProviderException pex)
        {
            _logger.LogWarning(pex, "Provider failed during generation {GenerationId}: {Error}", generationId, pex.Message);
            await _generationRepository.MarkFailedAsync(generationId, pex.ErrorCode, pex.Message[..Math.Min(pex.Message.Length, 1000)], ct);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected failure during generation {GenerationId}", generationId);
            await _generationRepository.MarkFailedAsync(generationId, "GENERATION_ERROR", ex.Message[..Math.Min(ex.Message.Length, 1000)], ct);
            throw new ProviderException($"Image generation failed: {ex.Message}", "GENERATION_ERROR");
        }
    }

    public async Task<GenerationResponse> GetGenerationAsync(
        Guid brandId,
        Guid generationId,
        Guid userId,
        CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        var generation = await _generationRepository.GetByIdAsync(generationId, ct);
        if (generation is null || generation.BrandId != brandId)
        {
            throw new NotFoundException("Generation not found", "GENERATION_NOT_FOUND");
        }

        return new GenerationResponse
        {
            Id = generation.Id,
            BrandId = generation.BrandId,
            Prompt = generation.Prompt,
            Provider = generation.Provider,
            Model = generation.Model,
            PlatformPreset = generation.PlatformPreset,
            Width = generation.Width,
            Height = generation.Height,
            LogoMode = generation.LogoMode,
            Status = generation.Status,
            ImageUrl = !string.IsNullOrWhiteSpace(generation.ImagePath) ? _storageService.GetPublicUrl(generation.ImagePath) : null,
            ErrorCode = generation.ErrorCode,
            ErrorMessage = generation.ErrorMessage,
            CreatedAt = generation.CreatedAt,
            CompletedAt = generation.CompletedAt
        };
    }

    public async Task<PagedGenerationsResponse> ListGenerationsAsync(
        Guid brandId,
        Guid userId,
        int page,
        int perPage,
        string? provider,
        string? status,
        CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        var clampedPage = Math.Max(1, page);
        var clampedPerPage = Math.Clamp(perPage, 1, 100);

        var normalizedProvider = string.IsNullOrWhiteSpace(provider) ? null : provider.Trim().ToLowerInvariant();
        var normalizedStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim().ToLowerInvariant();

        var items = await _generationRepository.ListByBrandAsync(brandId, clampedPage, clampedPerPage, normalizedProvider, normalizedStatus, ct);
        var totalCount = await _generationRepository.CountByBrandAsync(brandId, normalizedProvider, normalizedStatus, ct);

        var responseItems = items.Select(g => new GenerationResponse
        {
            Id = g.Id,
            BrandId = g.BrandId,
            Prompt = g.Prompt,
            Provider = g.Provider,
            Model = g.Model,
            PlatformPreset = g.PlatformPreset,
            Width = g.Width,
            Height = g.Height,
            LogoMode = g.LogoMode,
            Status = g.Status,
            ImageUrl = !string.IsNullOrWhiteSpace(g.ImagePath) ? _storageService.GetPublicUrl(g.ImagePath) : null,
            ErrorCode = g.ErrorCode,
            ErrorMessage = g.ErrorMessage,
            CreatedAt = g.CreatedAt,
            CompletedAt = g.CompletedAt
        }).ToList();

        return new PagedGenerationsResponse
        {
            Items = responseItems,
            TotalCount = totalCount,
            Page = clampedPage,
            PerPage = clampedPerPage
        };
    }

    public async Task DeleteGenerationAsync(
        Guid brandId,
        Guid generationId,
        Guid userId,
        CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        var generation = await _generationRepository.GetByIdAsync(generationId, ct);
        if (generation is null || generation.BrandId != brandId)
        {
            throw new NotFoundException("Generation not found", "GENERATION_NOT_FOUND");
        }

        if (!string.IsNullOrWhiteSpace(generation.ImagePath))
        {
            try
            {
                await _storageService.DeleteAsync(generation.ImagePath, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete storage file at {ImagePath} for generation {GenerationId}",
                    generation.ImagePath, generationId);
            }
        }

        await _generationRepository.DeleteAsync(generationId, ct);
    }
}
