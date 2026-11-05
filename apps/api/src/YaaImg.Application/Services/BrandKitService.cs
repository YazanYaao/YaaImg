using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.BrandKit;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Application.Services;

public partial class BrandKitService
{
    private readonly IBrandRepository _brandRepository;
    private readonly IBrandKitRepository _brandKitRepository;
    private readonly ILogger<BrandKitService> _logger;

    private static readonly HashSet<string> AllowedTones = new(StringComparer.OrdinalIgnoreCase)
    {
        "formal",
        "casual",
        "playful",
        "professional",
        "friendly"
    };

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColorRegex();

    public BrandKitService(
        IBrandRepository brandRepository,
        IBrandKitRepository brandKitRepository,
        ILogger<BrandKitService> logger)
    {
        _brandRepository = brandRepository;
        _brandKitRepository = brandKitRepository;
        _logger = logger;
    }

    public async Task<KitResponse> GetKitAsync(Guid brandId, Guid userId, CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        var kit = await _brandKitRepository.GetByBrandIdAsync(brandId, ct);
        if (kit is null)
        {
            kit = new BrandKit
            {
                BrandId = brandId,
                Status = "not_started",
                Colors = Array.Empty<string>(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        return MapToResponse(kit, brand.Name);
    }

    public async Task<KitResponse> UpsertKitAsync(
        Guid brandId,
        Guid userId,
        UpsertKitRequest request,
        CancellationToken ct = default)
    {
        var brand = await _brandRepository.GetByIdAsync(brandId, ct);
        if (brand is null || brand.OwnerUserId != userId)
        {
            throw new NotFoundException("Brand not found", "BRAND_NOT_FOUND");
        }

        var answers = request.Answers ?? new KitAnswers();

        // 1. Validate Tagline
        string? tagline = null;
        if (!string.IsNullOrWhiteSpace(answers.Tagline))
        {
            tagline = answers.Tagline.Trim();
            if (tagline.Length > 160)
            {
                throw new ValidationException("Tagline cannot exceed 160 characters.", "TAGLINE_TOO_LONG");
            }
        }

        // 2. Validate Tone
        string? tone = null;
        if (!string.IsNullOrWhiteSpace(answers.Tone))
        {
            tone = answers.Tone.Trim().ToLowerInvariant();
            if (!AllowedTones.Contains(tone))
            {
                throw new ValidationException($"Tone must be one of: {string.Join(", ", AllowedTones)}.", "INVALID_TONE");
            }
        }

        // 3. Validate Audience
        string? audience = null;
        if (!string.IsNullOrWhiteSpace(answers.Audience))
        {
            audience = answers.Audience.Trim();
            if (audience.Length < 2 || audience.Length > 500)
            {
                throw new ValidationException("Audience must be between 2 and 500 characters.", "INVALID_AUDIENCE");
            }
        }

        // 4. Validate Colors
        var colors = answers.Colors?
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToUpperInvariant())
            .Distinct()
            .ToArray() ?? Array.Empty<string>();

        if (colors.Length > 3)
        {
            throw new ValidationException("A brand can have at most 3 primary colors.", "TOO_MANY_COLORS");
        }

        foreach (var color in colors)
        {
            if (!HexColorRegex().IsMatch(color))
            {
                throw new ValidationException($"Invalid hex color: '{color}'. Colors must be in format #RRGGBB.", "INVALID_HEX_COLOR");
            }
        }

        // 5. Avoid Words
        string? avoidWords = string.IsNullOrWhiteSpace(answers.AvoidWords) ? null : answers.AvoidWords.Trim();

        // 6. Compute Status & Completion
        var status = ComputeStatus(tone, audience, colors, tagline, avoidWords);

        DateTime? completedAt = null;
        if (status == "complete")
        {
            var existingKit = await _brandKitRepository.GetByBrandIdAsync(brandId, ct);
            completedAt = existingKit?.CompletedAt ?? DateTime.UtcNow;
        }

        // 7. Derive Summary
        var normalizedAnswers = new KitAnswers
        {
            Tagline = tagline,
            Tone = tone,
            Audience = audience,
            Colors = colors,
            AvoidWords = avoidWords
        };
        var summary = DeriveSummary(brand.Name, normalizedAnswers);

        var kitEntity = new BrandKit
        {
            BrandId = brandId,
            Tagline = tagline,
            Tone = tone,
            Audience = audience,
            Colors = colors,
            AvoidWords = avoidWords,
            Summary = summary,
            Status = status,
            CompletedAt = completedAt,
            UpdatedAt = DateTime.UtcNow
        };

        var savedKit = await _brandKitRepository.UpsertAsync(kitEntity, ct);
        _logger.LogInformation("Brand kit updated for brand {BrandId} with status {Status}", brandId, status);

        return MapToResponse(savedKit, brand.Name);
    }

    public static string DeriveSummary(string brandName, KitAnswers answers)
    {
        var colorsStr = answers.Colors is { Length: > 0 }
            ? string.Join(", ", answers.Colors)
            : "None specified";

        var lines = new[]
        {
            $"Brand: {brandName}",
            $"Tagline: {(!string.IsNullOrWhiteSpace(answers.Tagline) ? answers.Tagline : "None specified")}",
            $"Tone: {(!string.IsNullOrWhiteSpace(answers.Tone) ? answers.Tone : "None specified")}",
            $"Audience: {(!string.IsNullOrWhiteSpace(answers.Audience) ? answers.Audience : "None specified")}",
            $"Colors: {colorsStr}",
            $"Avoid: {(!string.IsNullOrWhiteSpace(answers.AvoidWords) ? answers.AvoidWords : "None specified")}"
        };

        return string.Join("\n", lines);
    }

    private static string ComputeStatus(
        string? tone,
        string? audience,
        string[] colors,
        string? tagline,
        string? avoidWords)
    {
        if (!string.IsNullOrWhiteSpace(tone) &&
            !string.IsNullOrWhiteSpace(audience) &&
            colors.Length >= 1)
        {
            return "complete";
        }

        if (!string.IsNullOrWhiteSpace(tone) ||
            !string.IsNullOrWhiteSpace(audience) ||
            colors.Length > 0 ||
            !string.IsNullOrWhiteSpace(tagline) ||
            !string.IsNullOrWhiteSpace(avoidWords))
        {
            return "in_progress";
        }

        return "not_started";
    }

    private static KitResponse MapToResponse(BrandKit kit, string brandName)
    {
        return new KitResponse
        {
            BrandId = kit.BrandId,
            BrandName = brandName,
            Answers = new KitAnswers
            {
                Tagline = kit.Tagline,
                Tone = kit.Tone,
                Audience = kit.Audience,
                Colors = kit.Colors ?? Array.Empty<string>(),
                AvoidWords = kit.AvoidWords
            },
            Summary = kit.Summary,
            Status = kit.Status,
            CompletedAt = kit.CompletedAt,
            UpdatedAt = kit.UpdatedAt
        };
    }
}
