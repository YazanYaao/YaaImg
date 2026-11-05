using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.Admin;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Application.Services;

public class AdminService
{
    private readonly IAdminRepository _adminRepository;
    private readonly IStorageService _storageService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminService> _logger;

    public AdminService(
        IAdminRepository adminRepository,
        IStorageService storageService,
        IConfiguration configuration,
        ILogger<AdminService> logger)
    {
        _adminRepository = adminRepository;
        _storageService = storageService;
        _configuration = configuration;
        _logger = logger;
    }

    public void VerifyAdminAccess(string? userEmail)
    {
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            throw new ForbiddenException("Authentication identity does not contain an email.", "FORBIDDEN");
        }

        var adminEmailsRaw = _configuration["Admin:Emails"] ?? _configuration["ADMIN_EMAILS"];
        if (string.IsNullOrWhiteSpace(adminEmailsRaw))
        {
            _logger.LogWarning("Admin access attempted, but ADMIN_EMAILS configuration is empty.");
            throw new ForbiddenException("Administrative access is not configured.", "FORBIDDEN");
        }

        var allowedEmails = adminEmailsRaw
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(e => e.ToLowerInvariant())
            .ToHashSet();

        if (!allowedEmails.Contains(userEmail.Trim().ToLowerInvariant()))
        {
            _logger.LogWarning("Unauthorized admin access attempted by user {Email}", userEmail);
            throw new ForbiddenException("You do not have administrative access.", "FORBIDDEN");
        }
    }

    public async Task<AdminStatsResponse> GetStatsAsync(string? userEmail, CancellationToken ct = default)
    {
        VerifyAdminAccess(userEmail);
        return await _adminRepository.GetStatsAsync(ct);
    }

    public async Task<AdminBrandsResponse> GetAllBrandsAsync(string? userEmail, CancellationToken ct = default)
    {
        VerifyAdminAccess(userEmail);
        var rows = await _adminRepository.GetAllBrandsAsync(ct);

        var items = rows.Select(r => new AdminBrandItem
        {
            Id = r.Id,
            OwnerUserId = r.OwnerUserId,
            Name = r.Name,
            LogoUrl = !string.IsNullOrWhiteSpace(r.LogoPath) ? _storageService.GetPublicUrl(r.LogoPath) : null,
            KitStatus = r.KitStatus,
            TotalGenerations = r.TotalGenerations,
            SucceededGenerations = r.SucceededGenerations,
            ActiveKeysCount = r.ActiveKeysCount,
            CreatedAt = r.CreatedAt
        }).ToList();

        return new AdminBrandsResponse
        {
            Items = items,
            TotalCount = items.Count
        };
    }
}
