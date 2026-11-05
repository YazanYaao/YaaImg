using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using YaaImg.Application.Interfaces;
using YaaImg.Domain.Entities;

namespace YaaImg.Infrastructure.Repositories;

public class GenerationRepository : IGenerationRepository
{
    private readonly string _connectionString;

    public GenerationRepository(IConfiguration configuration)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = YaaImg.Infrastructure.Common.ConnectionStringHelper.Normalize(raw);
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task<Generation> InsertAsync(Generation generation, CancellationToken ct = default)
    {
        const string sql = @"
            INSERT INTO generations (
                id, brand_id, prompt, provider, model, platform_preset, width, height, logo_mode, status, created_at, updated_at
            )
            VALUES (
                @Id, @BrandId, @Prompt, @Provider::provider_t, @Model, @PlatformPreset::platform_preset_t, @Width, @Height, @LogoMode::logo_mode_t, @Status::generation_status_t, @CreatedAt, @UpdatedAt
            )
            RETURNING 
                id AS Id,
                brand_id AS BrandId,
                prompt AS Prompt,
                provider::text AS Provider,
                model AS Model,
                platform_preset::text AS PlatformPreset,
                width AS Width,
                height AS Height,
                logo_mode::text AS LogoMode,
                status::text AS Status,
                provider_request_id AS ProviderRequestId,
                image_path AS ImagePath,
                error_code AS ErrorCode,
                error_message AS ErrorMessage,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                completed_at AS CompletedAt;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new
        {
            generation.Id,
            generation.BrandId,
            generation.Prompt,
            generation.Provider,
            generation.Model,
            generation.PlatformPreset,
            generation.Width,
            generation.Height,
            generation.LogoMode,
            generation.Status,
            generation.CreatedAt,
            generation.UpdatedAt
        }, cancellationToken: ct);

        return await connection.QuerySingleAsync<Generation>(command);
    }

    public async Task UpdateStatusAsync(Guid id, string status, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE generations
            SET status = @Status::generation_status_t, updated_at = now()
            WHERE id = @Id;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { Id = id, Status = status }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }

    public async Task MarkSucceededAsync(Guid id, string imagePath, string? providerRequestId, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE generations
            SET status = 'succeeded'::generation_status_t,
                image_path = @ImagePath,
                provider_request_id = @ProviderRequestId,
                error_code = NULL,
                error_message = NULL,
                completed_at = now(),
                updated_at = now()
            WHERE id = @Id;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { Id = id, ImagePath = imagePath, ProviderRequestId = providerRequestId }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }

    public async Task MarkFailedAsync(Guid id, string errorCode, string? errorMessage, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE generations
            SET status = 'failed'::generation_status_t,
                image_path = NULL,
                error_code = @ErrorCode,
                error_message = @ErrorMessage,
                completed_at = now(),
                updated_at = now()
            WHERE id = @Id;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { Id = id, ErrorCode = errorCode, ErrorMessage = errorMessage }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }

    public async Task<Generation?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                brand_id AS BrandId,
                prompt AS Prompt,
                provider::text AS Provider,
                model AS Model,
                platform_preset::text AS PlatformPreset,
                width AS Width,
                height AS Height,
                logo_mode::text AS LogoMode,
                status::text AS Status,
                provider_request_id AS ProviderRequestId,
                image_path AS ImagePath,
                error_code AS ErrorCode,
                error_message AS ErrorMessage,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                completed_at AS CompletedAt
            FROM generations
            WHERE id = @Id;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { Id = id }, cancellationToken: ct);
        return await connection.QuerySingleOrDefaultAsync<Generation>(command);
    }

    public async Task<IReadOnlyList<Generation>> ListByBrandAsync(
        Guid brandId,
        int page,
        int perPage,
        string? provider,
        string? status,
        CancellationToken ct = default)
    {
        var offset = (page - 1) * perPage;
        var sql = @"
            SELECT 
                id AS Id,
                brand_id AS BrandId,
                prompt AS Prompt,
                provider::text AS Provider,
                model AS Model,
                platform_preset::text AS PlatformPreset,
                width AS Width,
                height AS Height,
                logo_mode::text AS LogoMode,
                status::text AS Status,
                provider_request_id AS ProviderRequestId,
                image_path AS ImagePath,
                error_code AS ErrorCode,
                error_message AS ErrorMessage,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt,
                completed_at AS CompletedAt
            FROM generations
            WHERE brand_id = @BrandId";

        var parameters = new DynamicParameters();
        parameters.Add("BrandId", brandId);
        parameters.Add("Limit", perPage);
        parameters.Add("Offset", offset);

        if (!string.IsNullOrWhiteSpace(provider))
        {
            sql += " AND provider = @Provider::provider_t";
            parameters.Add("Provider", provider);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            sql += " AND status = @Status::generation_status_t";
            parameters.Add("Status", status);
        }

        sql += " ORDER BY created_at DESC LIMIT @Limit OFFSET @Offset;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, parameters, cancellationToken: ct);
        var list = await connection.QueryAsync<Generation>(command);
        return list.ToList();
    }

    public async Task<int> CountByBrandAsync(
        Guid brandId,
        string? provider,
        string? status,
        CancellationToken ct = default)
    {
        var sql = @"
            SELECT COUNT(*)
            FROM generations
            WHERE brand_id = @BrandId";

        var parameters = new DynamicParameters();
        parameters.Add("BrandId", brandId);

        if (!string.IsNullOrWhiteSpace(provider))
        {
            sql += " AND provider = @Provider::provider_t";
            parameters.Add("Provider", provider);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            sql += " AND status = @Status::generation_status_t";
            parameters.Add("Status", status);
        }

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, parameters, cancellationToken: ct);
        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        const string sql = @"DELETE FROM generations WHERE id = @Id;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { Id = id }, cancellationToken: ct);
        var rowsAffected = await connection.ExecuteAsync(command);
        return rowsAffected > 0;
    }
}
