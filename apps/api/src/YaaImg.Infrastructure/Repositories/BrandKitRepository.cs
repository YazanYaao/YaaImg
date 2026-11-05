using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using YaaImg.Application.Interfaces;
using YaaImg.Domain.Entities;

namespace YaaImg.Infrastructure.Repositories;

public class BrandKitRepository : IBrandKitRepository
{
    private readonly string _connectionString;

    public BrandKitRepository(IConfiguration configuration)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = YaaImg.Infrastructure.Common.ConnectionStringHelper.Normalize(raw);
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task<BrandKit?> GetByBrandIdAsync(Guid brandId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                brand_id AS BrandId,
                tagline AS Tagline,
                tone::text AS Tone,
                audience AS Audience,
                colors AS Colors,
                avoid_words AS AvoidWords,
                summary AS Summary,
                status::text AS Status,
                completed_at AS CompletedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM brand_kits
            WHERE brand_id = @BrandId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId }, cancellationToken: ct);
        return await connection.QuerySingleOrDefaultAsync<BrandKit>(command);
    }

    public async Task<BrandKit> UpsertAsync(BrandKit kit, CancellationToken ct = default)
    {
        const string sql = @"
            INSERT INTO brand_kits (
                brand_id, tagline, tone, audience, colors, avoid_words, summary, status, completed_at, updated_at
            )
            VALUES (
                @BrandId, 
                @Tagline, 
                @Tone::tone_t, 
                @Audience, 
                @Colors, 
                @AvoidWords, 
                @Summary, 
                @Status::kit_status_t, 
                @CompletedAt, 
                now()
            )
            ON CONFLICT (brand_id) DO UPDATE SET
                tagline = EXCLUDED.tagline,
                tone = EXCLUDED.tone,
                audience = EXCLUDED.audience,
                colors = EXCLUDED.colors,
                avoid_words = EXCLUDED.avoid_words,
                summary = EXCLUDED.summary,
                status = EXCLUDED.status,
                completed_at = EXCLUDED.completed_at,
                updated_at = now()
            RETURNING 
                brand_id AS BrandId,
                tagline AS Tagline,
                tone::text AS Tone,
                audience AS Audience,
                colors AS Colors,
                avoid_words AS AvoidWords,
                summary AS Summary,
                status::text AS Status,
                completed_at AS CompletedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new
        {
            kit.BrandId,
            kit.Tagline,
            kit.Tone,
            kit.Audience,
            Colors = kit.Colors ?? Array.Empty<string>(),
            kit.AvoidWords,
            kit.Summary,
            kit.Status,
            kit.CompletedAt
        }, cancellationToken: ct);

        return await connection.QuerySingleAsync<BrandKit>(command);
    }
}
