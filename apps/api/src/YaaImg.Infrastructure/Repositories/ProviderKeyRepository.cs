using System.Data;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;
using YaaImg.Application.Interfaces;
using YaaImg.Domain.Entities;
using YaaImg.Domain.Exceptions;

namespace YaaImg.Infrastructure.Repositories;

public class ProviderKeyRepository : IProviderKeyRepository
{
    private readonly string _connectionString;

    public ProviderKeyRepository(IConfiguration configuration)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = YaaImg.Infrastructure.Common.ConnectionStringHelper.Normalize(raw);
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task<IReadOnlyList<ProviderKey>> ListByBrandAsync(Guid brandId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                brand_id AS BrandId,
                provider::text AS Provider,
                vault_secret_id AS VaultSecretId,
                label AS Label,
                key_hint AS KeyHint,
                is_active AS IsActive,
                is_valid AS IsValid,
                last_validated_at AS LastValidatedAt,
                last_validation_error AS LastValidationError,
                last_used_at AS LastUsedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM provider_keys
            WHERE brand_id = @BrandId
            ORDER BY created_at DESC;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId }, cancellationToken: ct);
        var keys = await connection.QueryAsync<ProviderKey>(command);
        return keys.ToList();
    }

    public async Task<ProviderKey?> GetByIdAsync(Guid keyId, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                brand_id AS BrandId,
                provider::text AS Provider,
                vault_secret_id AS VaultSecretId,
                label AS Label,
                key_hint AS KeyHint,
                is_active AS IsActive,
                is_valid AS IsValid,
                last_validated_at AS LastValidatedAt,
                last_validation_error AS LastValidationError,
                last_used_at AS LastUsedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM provider_keys
            WHERE id = @KeyId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { KeyId = keyId }, cancellationToken: ct);
        return await connection.QuerySingleOrDefaultAsync<ProviderKey>(command);
    }

    public async Task<ProviderKey> CreateAsync(ProviderKey key, CancellationToken ct = default)
    {
        const string sql = @"
            INSERT INTO provider_keys (
                id, brand_id, provider, vault_secret_id, label, key_hint, is_active, created_at, updated_at
            )
            VALUES (
                @Id, @BrandId, @Provider::provider_t, @VaultSecretId, @Label, @KeyHint, @IsActive, @CreatedAt, @UpdatedAt
            )
            RETURNING 
                id AS Id,
                brand_id AS BrandId,
                provider::text AS Provider,
                vault_secret_id AS VaultSecretId,
                label AS Label,
                key_hint AS KeyHint,
                is_active AS IsActive,
                is_valid AS IsValid,
                last_validated_at AS LastValidatedAt,
                last_validation_error AS LastValidationError,
                last_used_at AS LastUsedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt;";

        try
        {
            using var connection = CreateConnection();
            var command = new CommandDefinition(sql, new
            {
                key.Id,
                key.BrandId,
                key.Provider,
                key.VaultSecretId,
                key.Label,
                key.KeyHint,
                key.IsActive,
                key.CreatedAt,
                key.UpdatedAt
            }, cancellationToken: ct);

            return await connection.QuerySingleAsync<ProviderKey>(command);
        }
        catch (PostgresException ex) when (ex.SqlState == PostgresErrorCodes.UniqueViolation)
        {
            throw new ConflictException("An active key for this provider already exists.", "DUPLICATE_ACTIVE_KEY");
        }
    }

    public async Task<bool> DeleteAsync(Guid keyId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM provider_keys WHERE id = @KeyId;";
        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { KeyId = keyId }, cancellationToken: ct);
        var rowsAffected = await connection.ExecuteAsync(command);
        return rowsAffected > 0;
    }

    public async Task ActivateKeyAsync(Guid brandId, Guid keyId, string provider, CancellationToken ct = default)
    {
        using var connection = CreateConnection();
        await connection.OpenAsync(ct);
        using var transaction = await connection.BeginTransactionAsync(ct);

        const string deactivateSql = @"
            UPDATE provider_keys
            SET is_active = false, updated_at = now()
            WHERE brand_id = @BrandId AND provider = @Provider::provider_t AND is_active = true AND id != @KeyId;";

        const string activateSql = @"
            UPDATE provider_keys
            SET is_active = true, updated_at = now()
            WHERE id = @KeyId AND brand_id = @BrandId;";

        await connection.ExecuteAsync(new CommandDefinition(deactivateSql, new { BrandId = brandId, Provider = provider, KeyId = keyId }, transaction, cancellationToken: ct));
        await connection.ExecuteAsync(new CommandDefinition(activateSql, new { KeyId = keyId, BrandId = brandId }, transaction, cancellationToken: ct));

        await transaction.CommitAsync(ct);
    }

    public async Task UpdateValidationAsync(Guid keyId, bool? isValid, string? error, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE provider_keys
            SET is_valid = @IsValid,
                last_validated_at = now(),
                last_validation_error = @Error,
                updated_at = now()
            WHERE id = @KeyId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { KeyId = keyId, IsValid = isValid, Error = error }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }

    public async Task<int> CountByBrandAndProviderAsync(Guid brandId, string provider, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT COUNT(*)
            FROM provider_keys
            WHERE brand_id = @BrandId AND provider = @Provider::provider_t;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId, Provider = provider }, cancellationToken: ct);
        return await connection.ExecuteScalarAsync<int>(command);
    }

    public async Task<ProviderKey?> GetActiveAsync(Guid brandId, string provider, CancellationToken ct = default)
    {
        const string sql = @"
            SELECT 
                id AS Id,
                brand_id AS BrandId,
                provider::text AS Provider,
                vault_secret_id AS VaultSecretId,
                label AS Label,
                key_hint AS KeyHint,
                is_active AS IsActive,
                is_valid AS IsValid,
                last_validated_at AS LastValidatedAt,
                last_validation_error AS LastValidationError,
                last_used_at AS LastUsedAt,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM provider_keys
            WHERE brand_id = @BrandId 
              AND provider = @Provider::provider_t 
              AND is_active = true
            LIMIT 1;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { BrandId = brandId, Provider = provider }, cancellationToken: ct);
        return await connection.QuerySingleOrDefaultAsync<ProviderKey>(command);
    }

    public async Task MarkUsedAsync(Guid keyId, CancellationToken ct = default)
    {
        const string sql = @"
            UPDATE provider_keys
            SET last_used_at = now(), updated_at = now()
            WHERE id = @KeyId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { KeyId = keyId }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }
}
