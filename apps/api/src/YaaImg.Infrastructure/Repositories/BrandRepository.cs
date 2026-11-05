using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using YaaImg.Application.Interfaces;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Infrastructure.Repositories;

public class BrandRepository : IBrandRepository
{
    private readonly string _connectionString;

    public BrandRepository(IConfiguration configuration)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = YaaImg.Infrastructure.Common.ConnectionStringHelper.Normalize(raw);
    }

    private IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);

    public async Task<IReadOnlyList<Brand>> ListByOwnerAsync(Guid userId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                b.id AS Id,
                b.owner_user_id AS OwnerUserId,
                b.name AS Name,
                b.logo_path AS LogoPath,
                bk.status::text AS KitStatus,
                b.created_at AS CreatedAt,
                b.updated_at AS UpdatedAt
            FROM brands b
            LEFT JOIN brand_kits bk ON b.id = bk.brand_id
            WHERE b.owner_user_id = @UserId
            ORDER BY b.created_at DESC;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { UserId = userId }, cancellationToken: ct);
        var brands = await connection.QueryAsync<Brand>(command);
        return brands.ToList();
    }

    public async Task<Brand?> GetByIdAsync(Guid brandId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                b.id AS Id,
                b.owner_user_id AS OwnerUserId,
                b.name AS Name,
                b.logo_path AS LogoPath,
                bk.status::text AS KitStatus,
                b.created_at AS CreatedAt,
                b.updated_at AS UpdatedAt
            FROM brands b
            LEFT JOIN brand_kits bk ON b.id = bk.brand_id
            WHERE b.id = @BrandId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId }, cancellationToken: ct);
        return await connection.QuerySingleOrDefaultAsync<Brand>(command);
    }

    public async Task<Brand> CreateAsync(Brand brand, CancellationToken ct = default)
    {
        const string sql = @"
            INSERT INTO brands (id, owner_user_id, name, logo_path, created_at, updated_at)
            VALUES (@Id, @OwnerUserId, @Name, @LogoPath, @CreatedAt, @UpdatedAt)
            RETURNING 
                id AS Id, 
                owner_user_id AS OwnerUserId, 
                name AS Name, 
                logo_path AS LogoPath, 
                created_at AS CreatedAt, 
                updated_at AS UpdatedAt;";

        try
        {
            using var connection = CreateConnection();
            var command = new CommandDefinition(sql, new
            {
                brand.Id,
                brand.OwnerUserId,
                brand.Name,
                brand.LogoPath,
                brand.CreatedAt,
                brand.UpdatedAt
            }, cancellationToken: ct);

            var created = await connection.QuerySingleAsync<Brand>(command);
            created.KitStatus = "not_started";
            return created;
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new ConflictException("A brand with this name already exists.", "DUPLICATE_BRAND_NAME");
        }
    }

    public async Task<bool> DeleteAsync(Guid brandId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM brands WHERE id = @BrandId;";
        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId }, cancellationToken: ct);
        var rowsAffected = await connection.ExecuteAsync(command);
        return rowsAffected > 0;
    }

    public async Task<bool> UpdateLogoPathAsync(Guid brandId, string? logoPath, CancellationToken ct = default)
    {
        const string sql = "UPDATE brands SET logo_path = @LogoPath, updated_at = now() WHERE id = @BrandId;";
        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId, LogoPath = logoPath }, cancellationToken: ct);
        var rowsAffected = await connection.ExecuteAsync(command);
        return rowsAffected > 0;
    }

    public async Task<IReadOnlyList<string>> GetImagePathsByBrandIdAsync(Guid brandId, CancellationToken ct = default)
    {
        const string sql = "SELECT image_path FROM generations WHERE brand_id = @BrandId AND image_path IS NOT NULL;";
        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId }, cancellationToken: ct);
        var paths = await connection.QueryAsync<string>(command);
        return paths.ToList();
    }
}
