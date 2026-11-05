using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using YaaImg.Application.Interfaces;
using YaaImg.Contracts.Admin;
using YaaImg.Infrastructure.Common;

namespace YaaImg.Infrastructure.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly string _connectionString;

    public AdminRepository(IConfiguration configuration)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = ConnectionStringHelper.Normalize(raw);
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<AdminStatsResponse> GetStatsAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                (SELECT COUNT(*) FROM brands) AS TotalBrands,
                (SELECT COUNT(DISTINCT owner_user_id) FROM brands) AS TotalUsers,
                (SELECT COUNT(*) FROM generations) AS TotalGenerations,
                (SELECT COUNT(*) FROM generations WHERE status = 'succeeded') AS SucceededGenerations,
                (SELECT COUNT(*) FROM generations WHERE status = 'failed') AS FailedGenerations,
                (SELECT COUNT(*) FROM generations WHERE provider = 'openai') AS OpenAiGenerations,
                (SELECT COUNT(*) FROM generations WHERE provider = 'gemini') AS GeminiGenerations,
                (SELECT COUNT(*) FROM generations WHERE provider = 'qwen') AS QwenGenerations,
                (SELECT COUNT(*) FROM provider_keys WHERE is_active = true AND provider = 'openai') AS ActiveOpenAiKeys,
                (SELECT COUNT(*) FROM provider_keys WHERE is_active = true AND provider = 'gemini') AS ActiveGeminiKeys,
                (SELECT COUNT(*) FROM provider_keys WHERE is_active = true AND provider = 'qwen') AS ActiveQwenKeys;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, cancellationToken: ct);
        var stats = await connection.QuerySingleOrDefaultAsync<AdminStatsResponse>(command);
        return stats ?? new AdminStatsResponse();
    }

    public async Task<IReadOnlyList<AdminBrandRow>> GetAllBrandsAsync(CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                b.id AS Id,
                b.owner_user_id AS OwnerUserId,
                b.name AS Name,
                b.logo_path AS LogoPath,
                COALESCE(bk.status::text, 'not_started') AS KitStatus,
                b.created_at AS CreatedAt,
                (SELECT COUNT(*) FROM generations g WHERE g.brand_id = b.id) AS TotalGenerations,
                (SELECT COUNT(*) FROM generations g WHERE g.brand_id = b.id AND g.status = 'succeeded') AS SucceededGenerations,
                (SELECT COUNT(*) FROM provider_keys pk WHERE pk.brand_id = b.id AND pk.is_active = true) AS ActiveKeysCount
            FROM brands b
            LEFT JOIN brand_kits bk ON b.id = bk.brand_id
            ORDER BY b.created_at DESC;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, cancellationToken: ct);
        var rows = await connection.QueryAsync<AdminBrandRow>(command);
        return rows.ToList();
    }
}
