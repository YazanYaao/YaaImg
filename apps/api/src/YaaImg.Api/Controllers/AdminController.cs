using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using YaaImg.Application.Services;
using YaaImg.Contracts.Admin;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Controllers;

[ApiController]
[Route("admin")]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;

    public AdminController(AdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminStatsResponse>> GetStats(CancellationToken ct)
    {
        var email = GetUserEmail();
        var stats = await _adminService.GetStatsAsync(email, ct);
        return Ok(stats);
    }

    [HttpGet("brands")]
    [ProducesResponseType(typeof(AdminBrandsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<AdminBrandsResponse>> GetBrands(CancellationToken ct)
    {
        var email = GetUserEmail();
        var brands = await _adminService.GetAllBrandsAsync(email, ct);
        return Ok(brands);
    }

    private string GetUserEmail()
    {
        if (HttpContext.Items.TryGetValue("UserEmail", out var emailObj) && emailObj is string email && !string.IsNullOrWhiteSpace(email))
        {
            return email;
        }

        var claimEmail = User.Claims.FirstOrDefault(c =>
            c.Type == "email" ||
            c.Type == ClaimTypes.Email ||
            c.Type == JwtRegisteredClaimNames.Email)?.Value;

        if (!string.IsNullOrWhiteSpace(claimEmail))
        {
            return claimEmail;
        }

        throw new ForbiddenException("Authenticated user email is missing.", "FORBIDDEN");
    }
}
