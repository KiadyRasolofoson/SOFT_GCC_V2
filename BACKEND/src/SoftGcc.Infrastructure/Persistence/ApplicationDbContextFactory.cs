using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence;

public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var apiPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "SoftGcc.Api");
        var basePath = Directory.Exists(apiPath) ? apiPath : Directory.GetCurrentDirectory();
        var configurationBuilder = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true);

        if (OperatingSystem.IsWindows())
        {
            configurationBuilder.AddJsonFile("appsettings.Windows.json", optional: true);
        }

        var configuration = configurationBuilder
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration["ConnectionStrings:DefaultConnection"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                OperatingSystem.IsWindows()
                    ? "ConnectionStrings:DefaultConnection est manquante. Vérifiez appsettings.Windows.json (authentification Windows)."
                    : "Les chaînes de connexion SQL Server (authentification Windows) ne sont chargées que sous Windows. Définissez ConnectionStrings__DefaultConnection si besoin.");
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.GetName().Name))
            .Options;

        return new ApplicationDbContext(options);
    }
}
