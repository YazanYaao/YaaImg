using Microsoft.AspNetCore.Mvc;
using YaaImg.Application.Services;
using YaaImg.Contracts.Brands;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Controllers;

[ApiController]
[Route("brands")]
public class BrandsController : ControllerBase
{
    private readonly BrandService _brandService;

    public BrandsController(BrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(BrandListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BrandListResponse>> ListBrands(CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandService.ListBrandsAsync(userId, ct);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BrandResponse>> CreateBrand([FromBody] CreateBrandRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandService.CreateBrandAsync(userId, request, ct);
        return CreatedAtAction(nameof(GetBrand), new { id = response.Id }, response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BrandResponse>> GetBrand(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandService.GetBrandAsync(id, userId, ct);
        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteBrand(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        await _brandService.DeleteBrandAsync(id, userId, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/logo")]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BrandResponse>> UploadLogo(Guid id, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            throw new ValidationException("No file was uploaded.", "NO_FILE_PROVIDED");
        }

        var userId = GetUserId();
        using var stream = file.OpenReadStream();
        var response = await _brandService.UploadLogoAsync(
            id,
            userId,
            stream,
            file.ContentType,
            file.FileName,
            file.Length,
            ct);

        return Ok(response);
    }

    [HttpDelete("{id:guid}/logo")]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BrandResponse>> DeleteLogo(Guid id, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandService.DeleteLogoAsync(id, userId, ct);
        return Ok(response);
    }

    private Guid GetUserId()
    {
        if (HttpContext.Items.TryGetValue("UserId", out var userIdObj) && userIdObj is Guid userId)
        {
            return userId;
        }

        throw new ForbiddenException("Authenticated user context is missing.", "FORBIDDEN");
    }
}
