using Microsoft.AspNetCore.Mvc;
using YaaImg.Application.Services;
using YaaImg.Contracts.Generations;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Controllers;

[ApiController]
[Route("brands/{brandId:guid}")]
public class GenerationsController : ControllerBase
{
    private readonly GenerationService _generationService;

    public GenerationsController(GenerationService generationService)
    {
        _generationService = generationService;
    }

    [HttpPost("generate")]
    [ProducesResponseType(typeof(GenerationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<ActionResult<GenerationResponse>> Generate(
        Guid brandId,
        [FromBody] GenerateRequest request,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _generationService.GenerateImageAsync(brandId, userId, request, ct);
        return Ok(response);
    }

    [HttpGet("generations/{generationId:guid}")]
    [ProducesResponseType(typeof(GenerationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GenerationResponse>> GetGeneration(
        Guid brandId,
        Guid generationId,
        CancellationToken ct)
    {
        var userId = GetUserId();
        var response = await _generationService.GetGenerationAsync(brandId, generationId, userId, ct);
        return Ok(response);
    }

    [HttpGet("generations")]
    [ProducesResponseType(typeof(PagedGenerationsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedGenerationsResponse>> ListGenerations(
        Guid brandId,
        [FromQuery] int page = 1,
        [FromQuery] int perPage = 12,
        [FromQuery] string? provider = null,
        [FromQuery] string? status = null,
        CancellationToken ct = default)
    {
        var userId = GetUserId();
        var response = await _generationService.ListGenerationsAsync(brandId, userId, page, perPage, provider, status, ct);
        return Ok(response);
    }

    [HttpDelete("generations/{generationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteGeneration(
        Guid brandId,
        Guid generationId,
        CancellationToken ct)
    {
        var userId = GetUserId();
        await _generationService.DeleteGenerationAsync(brandId, generationId, userId, ct);
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
