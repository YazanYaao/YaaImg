using Microsoft.AspNetCore.Mvc;
using YaaImg.Application.Services;
using YaaImg.Contracts.ProviderKeys;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Controllers;

[ApiController]
[Route("brands/{brandId:guid}/keys")]
public class ProviderKeysController : ControllerBase
{
    private readonly ProviderKeyService _keyService;

    public ProviderKeysController(ProviderKeyService keyService)
    {
        _keyService = keyService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(KeyListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KeyListResponse>> ListKeys(Guid brandId, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _keyService.ListKeysAsync(brandId, userId, ct);
        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType(typeof(KeyResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<KeyResponse>> AddKey(Guid brandId, [FromBody] AddKeyRequest request, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _keyService.AddKeyAsync(brandId, userId, request, ct);
        return Created($"/brands/{brandId}/keys/{response.Id}", response);
    }

    [HttpPatch("{keyId:guid}/activate")]
    [ProducesResponseType(typeof(KeyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<KeyResponse>> ActivateKey(Guid brandId, Guid keyId, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _keyService.ActivateKeyAsync(brandId, keyId, userId, ct);
        return Ok(response);
    }

    [HttpPost("{keyId:guid}/validate")]
    [ProducesResponseType(typeof(ValidateKeyResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ValidateKeyResponse>> ValidateKey(Guid brandId, Guid keyId, CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _keyService.ValidateKeyAsync(brandId, keyId, userId, ct);
        return Ok(response);
    }

    [HttpDelete("{keyId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteKey(Guid brandId, Guid keyId, CancellationToken ct)
    {
        var userId = GetUserId();
        await _keyService.DeleteKeyAsync(brandId, keyId, userId, ct);
        return NoContent();
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
