using Dapper;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Npgsql;
using YaaImg.Application.Interfaces;

namespace YaaImg.Infrastructure.Services;

public class SupabaseVaultService : IVaultService
{
    private readonly string _connectionString;
    private readonly ILogger<SupabaseVaultService> _logger;

    public SupabaseVaultService(IConfiguration configuration, ILogger<SupabaseVaultService> logger)
    {
        var raw = configuration["SUPABASE_DB_URL"]
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' or 'SUPABASE_DB_URL' is not configured.");
        _connectionString = YaaImg.Infrastructure.Common.ConnectionStringHelper.Normalize(raw);
        _logger = logger;
    }

    private NpgsqlConnection CreateConnection() => new(_connectionString);

    public async Task<Guid> StoreSecretAsync(string secretValue, string name, CancellationToken ct = default)
    {
        const string sql = "SELECT vault.create_secret(@SecretValue, @Name);";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { SecretValue = secretValue, Name = name }, cancellationToken: ct);
        var secretId = await connection.ExecuteScalarAsync<Guid>(command);
        return secretId;
    }

    public async Task<string?> RetrieveSecretAsync(Guid secretId, CancellationToken ct = default)
    {
        const string sql = "SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = @SecretId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { SecretId = secretId }, cancellationToken: ct);
        var secret = await connection.QuerySingleOrDefaultAsync<string>(command);
        return secret;
    }

    public async Task DeleteSecretAsync(Guid secretId, CancellationToken ct = default)
    {
        const string sql = "DELETE FROM vault.secrets WHERE id = @SecretId;";

        using var connection = CreateConnection();
        var command = new CommandDefinition(sql, new { SecretId = secretId }, cancellationToken: ct);
        await connection.ExecuteAsync(command);
    }
}
