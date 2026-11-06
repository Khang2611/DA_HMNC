using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Testcontainers.MsSql;

namespace SmartInventory.Api.IntegrationTests;

public class MsSqlDatabaseFixture : IAsyncLifetime
{
    private readonly MsSqlContainer _container = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    public string ConnectionString { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        var scriptPath = FindSqlScriptPath();
        var rawScript = await File.ReadAllTextAsync(scriptPath);

        // Execute baseline script against master connection
        var masterConnectionString = _container.GetConnectionString();
        await using (var connection = new SqlConnection(masterConnectionString))
        {
            await connection.OpenAsync();

            var batches = Regex.Split(rawScript, @"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);
            foreach (var batch in batches)
            {
                var trimmed = batch.Trim();
                if (string.IsNullOrWhiteSpace(trimmed))
                {
                    continue;
                }

                await using var command = connection.CreateCommand();
                command.CommandText = trimmed;
                command.CommandTimeout = 120;
                await command.ExecuteNonQueryAsync();
            }
        }

        // Configure connection string targeting SmartInventoryDB
        var builder = new SqlConnectionStringBuilder(masterConnectionString)
        {
            InitialCatalog = "SmartInventoryDB"
        };

        ConnectionString = builder.ConnectionString;
    }

    public async Task DisposeAsync()
    {
        await _container.DisposeAsync();
    }

    private static string FindSqlScriptPath()
    {
        var current = AppDomain.CurrentDomain.BaseDirectory;
        while (!string.IsNullOrEmpty(current))
        {
            var candidate = Path.Combine(current, "db", "baseline", "001_SmartInventoryDB.sql");
            if (File.Exists(candidate))
            {
                return candidate;
            }

            var parent = Directory.GetParent(current);
            if (parent == null)
            {
                break;
            }

            current = parent.FullName;
        }

        throw new FileNotFoundException("Không tìm thấy file db/baseline/001_SmartInventoryDB.sql.");
    }
}
