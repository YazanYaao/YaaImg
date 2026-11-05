using System.Diagnostics;
using System.Text.Json;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Api.Middleware;

public class ProblemDetailsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ProblemDetailsMiddleware> _logger;

    public ProblemDetailsMiddleware(RequestDelegate next, ILogger<ProblemDetailsMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing request {Path}", context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        int status;
        string type;
        string title;
        string detail;
        string errorCode;

        switch (exception)
        {
            case NotFoundException nfe:
                status = StatusCodes.Status404NotFound;
                type = "https://yaaimg.com/errors/not-found";
                title = "Resource Not Found";
                detail = nfe.Message;
                errorCode = nfe.ErrorCode;
                break;

            case ValidationException ve:
                status = StatusCodes.Status400BadRequest;
                type = "https://yaaimg.com/errors/validation-error";
                title = "Validation Error";
                detail = ve.Message;
                errorCode = ve.ErrorCode;
                break;

            case ConflictException ce:
                status = StatusCodes.Status409Conflict;
                type = "https://yaaimg.com/errors/conflict";
                title = "Conflict";
                detail = ce.Message;
                errorCode = ce.ErrorCode;
                break;

            case ForbiddenException fe:
                status = StatusCodes.Status403Forbidden;
                type = "https://yaaimg.com/errors/forbidden";
                title = "Forbidden";
                detail = fe.Message;
                errorCode = fe.ErrorCode;
                break;

            case ProviderException pe:
                status = StatusCodes.Status502BadGateway;
                type = "https://yaaimg.com/errors/provider-error";
                title = "AI Provider Error";
                detail = pe.Message;
                errorCode = pe.ErrorCode;
                break;

            default:
                status = StatusCodes.Status500InternalServerError;
                type = "https://yaaimg.com/errors/internal-error";
                title = "Internal Server Error";
                detail = "An unexpected error occurred while processing the request.";
                errorCode = "INTERNAL_ERROR";
                break;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = status;

        var problemDetails = new
        {
            type,
            title,
            status,
            detail,
            traceId,
            errorCode
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
