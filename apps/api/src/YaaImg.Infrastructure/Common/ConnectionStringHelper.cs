using Npgsql;

namespace YaaImg.Infrastructure.Common;

public static class ConnectionStringHelper
{
    public static string Normalize(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var trimmed = connectionString.Trim();
        var isRunningInContainer = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

        if (trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
        {
            var uri = new Uri(trimmed);
            var userInfo = uri.UserInfo.Split(':');
            var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
            var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
            var host = uri.Host;

            if (isRunningInContainer && (host == "127.0.0.1" || host.Equals("localhost", StringComparison.OrdinalIgnoreCase)))
            {
                host = "host.docker.internal";
            }

            var port = uri.Port > 0 ? uri.Port : 5432;
            var database = uri.AbsolutePath.TrimStart('/');

            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = host,
                Port = port,
                Database = database,
                Username = username,
                Password = password
            };

            return builder.ConnectionString;
        }

        if (isRunningInContainer)
        {
            try
            {
                var builder = new NpgsqlConnectionStringBuilder(trimmed);
                if (builder.Host == "127.0.0.1" || builder.Host?.Equals("localhost", StringComparison.OrdinalIgnoreCase) == true)
                {
                    builder.Host = "host.docker.internal";
                    return builder.ConnectionString;
                }
            }
            catch
            {
                // Fall back to original trimmed string
            }
        }

        return trimmed;
    }
}
