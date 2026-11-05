using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.IdentityModel.Tokens;

namespace YaaImg.Api.Middleware;

public class JwtAuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtAuthMiddleware> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private readonly SemaphoreSlim _keyLock = new(1, 1);
    private IReadOnlyList<SecurityKey> _cachedSigningKeys = [];
    private DateTime _lastFetchedUtc = DateTime.MinValue;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(1);

    public JwtAuthMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<JwtAuthMiddleware> logger,
        IHttpClientFactory httpClientFactory)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Skip auth for public endpoints
        if (path.Equals("/health", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await WriteUnauthorizedResponseAsync(context, "Missing or invalid Authorization header.");
            return;
        }

        var token = authHeader["Bearer ".Length..].Trim();
        var supabaseUrl = _configuration["Supabase:Url"] ?? _configuration["SUPABASE_URL"];
        var jwtSecret = _configuration["Supabase:JwtSecret"] ?? _configuration["SUPABASE_JWT_SECRET"];

        if (string.IsNullOrWhiteSpace(supabaseUrl) && string.IsNullOrWhiteSpace(jwtSecret))
        {
            _logger.LogError("Neither Supabase:Url nor Supabase:JwtSecret is configured in appsettings.");
            await WriteUnauthorizedResponseAsync(context, "Authentication service is not properly configured.");
            return;
        }

        var signingKeys = await GetSigningKeysAsync(supabaseUrl, jwtSecret, forceRefresh: false, context.RequestAborted);
        if (signingKeys.Count == 0)
        {
            _logger.LogError("No valid signing keys could be resolved for JWT validation.");
            await WriteUnauthorizedResponseAsync(context, "Authentication service is not properly configured.");
            return;
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        ClaimsPrincipal? principal = null;

        try
        {
            principal = ValidateToken(tokenHandler, token, signingKeys);
        }
        catch (SecurityTokenSignatureKeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Signing key not found in cache. Refreshing JWKS and retrying...");
            var freshKeys = await GetSigningKeysAsync(supabaseUrl, jwtSecret, forceRefresh: true, context.RequestAborted);
            try
            {
                principal = ValidateToken(tokenHandler, token, freshKeys);
            }
            catch (Exception retryEx)
            {
                _logger.LogWarning(retryEx, "JWT token validation failed on retry after key refresh.");
                await WriteUnauthorizedResponseAsync(context, "Invalid or expired authentication token.");
                return;
            }
        }
        catch (SecurityTokenException ex)
        {
            _logger.LogWarning(ex, "JWT token validation failed.");
            await WriteUnauthorizedResponseAsync(context, "Invalid or expired authentication token.");
            return;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation.");
            await WriteUnauthorizedResponseAsync(context, "Authentication failed.");
            return;
        }

        if (principal is null)
        {
            await WriteUnauthorizedResponseAsync(context, "Invalid or expired authentication token.");
            return;
        }

        var subClaim = principal.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub || c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        if (string.IsNullOrWhiteSpace(subClaim) || !Guid.TryParse(subClaim, out var userId))
        {
            await WriteUnauthorizedResponseAsync(context, "Token does not contain a valid user ID claim.");
            return;
        }

        context.Items["UserId"] = userId;

        var emailClaim = principal.Claims.FirstOrDefault(c =>
            c.Type == "email" ||
            c.Type == ClaimTypes.Email ||
            c.Type == JwtRegisteredClaimNames.Email)?.Value;

        if (!string.IsNullOrWhiteSpace(emailClaim))
        {
            context.Items["UserEmail"] = emailClaim.Trim();
        }

        context.User = principal;

        // Execute downstream middleware/controller pipeline OUTSIDE token validation try/catch
        await _next(context);
    }

    private static ClaimsPrincipal ValidateToken(
        JwtSecurityTokenHandler tokenHandler,
        string token,
        IReadOnlyList<SecurityKey> keys)
    {
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKeys = keys,
            ValidateIssuer = false,
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5)
        };

        return tokenHandler.ValidateToken(token, validationParameters, out _);
    }

    private async Task<IReadOnlyList<SecurityKey>> GetSigningKeysAsync(
        string? supabaseUrl,
        string? jwtSecret,
        bool forceRefresh,
        CancellationToken ct)
    {
        if (!forceRefresh && _cachedSigningKeys.Count > 0 && DateTime.UtcNow - _lastFetchedUtc < CacheDuration)
        {
            return _cachedSigningKeys;
        }

        await _keyLock.WaitAsync(ct);
        try
        {
            if (!forceRefresh && _cachedSigningKeys.Count > 0 && DateTime.UtcNow - _lastFetchedUtc < CacheDuration)
            {
                return _cachedSigningKeys;
            }

            var keys = new List<SecurityKey>();

            // 1. Fetch JWKS from Supabase if URL is configured
            if (!string.IsNullOrWhiteSpace(supabaseUrl))
            {
                try
                {
                    var jwksUrl = $"{supabaseUrl.TrimEnd('/')}/auth/v1/.well-known/jwks.json";
                    using var httpClient = _httpClientFactory.CreateClient();
                    httpClient.Timeout = TimeSpan.FromSeconds(10);
                    var jwksJson = await httpClient.GetStringAsync(jwksUrl, ct);
                    var jwks = new JsonWebKeySet(jwksJson);
                    var jwksKeys = jwks.GetSigningKeys();
                    keys.AddRange(jwksKeys);
                    _logger.LogInformation("Loaded {Count} signing key(s) from Supabase JWKS endpoint.", jwksKeys.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to load keys from Supabase JWKS endpoint. Falling back to configured secret.");
                }
            }

            // 2. Add symmetric secret if configured (minimum 32 bytes/characters for HMAC-SHA256)
            if (!string.IsNullOrWhiteSpace(jwtSecret) && jwtSecret.Length >= 32)
            {
                try
                {
                    byte[] keyBytes;
                    try
                    {
                        keyBytes = Convert.FromBase64String(jwtSecret);
                    }
                    catch (FormatException)
                    {
                        keyBytes = Encoding.UTF8.GetBytes(jwtSecret);
                    }

                    keys.Add(new SymmetricSecurityKey(keyBytes));
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to parse Supabase:JwtSecret as symmetric key.");
                }
            }

            _cachedSigningKeys = keys;
            _lastFetchedUtc = DateTime.UtcNow;
            return _cachedSigningKeys;
        }
        finally
        {
            _keyLock.Release();
        }
    }

    private static async Task WriteUnauthorizedResponseAsync(HttpContext context, string detail)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;

        var problemDetails = new
        {
            type = "https://yaaimg.com/errors/unauthorized",
            title = "Unauthorized",
            status = StatusCodes.Status401Unauthorized,
            detail,
            traceId,
            errorCode = "UNAUTHORIZED"
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}
