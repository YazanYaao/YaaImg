using Microsoft.AspNetCore.Mvc;
using YaaImg.Application.Services;
using YaaImg.Contracts.BrandKit;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Controllers;

[ApiController]
[Route("brands/{brandId:guid}/kit")]
public class BrandKitController : ControllerBase
{
    private readonly BrandKitService _brandKitService;

    public BrandKitController(BrandKitService brandKitService)
    {
        _brandKitService = brandKitService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(KitResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KitResponse>> GetKit(Guid brandId, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandKitService.GetKitAsync(brandId, userId, ct);
        return Ok(response);
    }

    [HttpPut]
    [ProducesResponseType(typeof(KitResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KitResponse>> UpsertKit(
        Guid brandId,
        [FromBody] UpsertKitRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _brandKitService.UpsertKitAsync(brandId, userId, request, ct);
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
