using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public const string DefaultAdminEmail = "admin@local";
    public const string DefaultAdminPassword = "Admin123!";

    private const string CreationScript = "creation_table_competence_carriere_query.sql";
    private const string ViewsScript = "Created_view_soft_gcc.sql";
    private static readonly string EvalTablesScript = Path.Combine("eval", "01_TABLES_EVALUATIONS.sql");
    private static readonly string EvalViewsScript = Path.Combine("eval", "02_VUES_EVALUATIONS.sql");

    private static readonly string[] SeedScripts =
    {
        Path.Combine("eval", "03_DONNEES_ESSENTIELLES.sql"),
        Path.Combine("eval", "04_SEED_MODULES.sql"),
        Path.Combine("eval", "09_SYNC_PERMISSIONS_MODULES.sql"),
        "seed_publish_skill_referential.sql",
    };

    private const string LicenseTableSql = """
        IF OBJECT_ID(N'dbo.license', N'U') IS NULL
        BEGIN
            CREATE TABLE dbo.license (
                license_id              UNIQUEIDENTIFIER    NOT NULL PRIMARY KEY,
                license_key             NVARCHAR(MAX)       NOT NULL,
                machine_id              NVARCHAR(512)       NOT NULL,
                customer_id             NVARCHAR(256)       NOT NULL,
                expire_at               DATETIME2           NOT NULL,
                issued_at               DATETIME2           NOT NULL,
                license_type            NVARCHAR(50)        NOT NULL,
                features                NVARCHAR(MAX)       NOT NULL DEFAULT '[]',
                last_validated_at       DATETIME2           NULL,
                is_clock_rollback_detected BIT              NOT NULL DEFAULT 0,
                created_at              DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
                updated_at              DATETIME2           NOT NULL DEFAULT GETUTCDATE()
            );

            CREATE NONCLUSTERED INDEX IX_license_machine_id
                ON dbo.license (machine_id);
            CREATE NONCLUSTERED INDEX IX_license_last_validated_at
                ON dbo.license (last_validated_at);
            CREATE NONCLUSTERED INDEX IX_license_expire_at
                ON dbo.license (expire_at);
        END
        """;

    public static async Task InitializeAsync(
        IServiceProvider services,
        IConfiguration configuration,
        IHostEnvironment environment,
        CancellationToken cancellationToken = default)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DatabaseInitializer));
        var apply = configuration.GetValue<bool?>("Database:ApplyOnStartup") ?? environment.IsDevelopment();
        var seed = configuration.GetValue<bool?>("Database:SeedIfEmpty") ?? environment.IsDevelopment();

        if (!apply)
        {
            logger.LogInformation("Auto-migration désactivée (Database:ApplyOnStartup=false).");
            return;
        }

        var connectionString = configuration["ConnectionStrings:DefaultConnection"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(MissingConnectionMessage());
        }

        var scriptsRoot = ResolveScriptsRoot(environment);
        logger.LogInformation("Initialisation de Soft_GCC (scripts : {ScriptsRoot}).", scriptsRoot);

        try
        {
            await EnsureDatabaseExistsAsync(connectionString, logger, cancellationToken);
            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            await ApplyBaselineSchemaAsync(connection, scriptsRoot, logger, cancellationToken);
            await ExecuteSqlAsync(connection, LicenseTableSql, cancellationToken);
            await EnsureEstablishmentColumnsAsync(connection, cancellationToken);
            await EnsureVEmployeeDetailsSubmittedStateAsync(connection, logger, cancellationToken);
        }
        catch (SqlException ex) when (IsConnectivityError(ex))
        {
            throw new InvalidOperationException(
                "Impossible de joindre SQL Server. Vérifiez que l'instance locale tourne et que votre compte Windows a le droit de créer une base (dbcreator).",
                ex);
        }

        await using (var scope = services.CreateAsyncScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            logger.LogInformation("Application des migrations EF Core.");
            await context.Database.MigrateAsync(cancellationToken);

            if (seed)
            {
                await using var connection = new SqlConnection(connectionString);
                await connection.OpenAsync(cancellationToken);
                logger.LogInformation("Exécution des seeds idempotents.");
                foreach (var relative in SeedScripts)
                {
                    await ExecuteScriptFileAsync(connection, scriptsRoot, relative, splitBatches: false, logger, cancellationToken);
                }

                await ApplyViewCompatibilityColumnsAsync(connection, logger, cancellationToken);
                await EnsureAdminUserAsync(context, logger, cancellationToken);
            }
        }

        logger.LogInformation("Initialisation de la base terminée.");
    }

    public static string MissingConnectionMessage() =>
        OperatingSystem.IsWindows()
            ? "ConnectionStrings:DefaultConnection est manquante. Vérifiez appsettings.Windows.json (authentification Windows / Trusted_Connection)."
            : "Les chaînes de connexion SQL Server (authentification Windows) ne sont chargées que sous Windows. Définissez ConnectionStrings__DefaultConnection si vous devez cibler SQL Server hors Windows.";

    private static string ResolveScriptsRoot(IHostEnvironment environment)
    {
        var candidates = new[]
        {
            Path.Combine(environment.ContentRootPath, "bdd"),
            Path.Combine(AppContext.BaseDirectory, "bdd"),
        };

        foreach (var candidate in candidates)
        {
            if (Directory.Exists(candidate))
                return candidate;
        }

        throw new InvalidOperationException(
            "Dossier des scripts SQL introuvable (attendu : bdd/ sous le projet SoftGcc.Api ou en sortie de build).");
    }

    private static async Task ApplyBaselineSchemaAsync(
        SqlConnection connection,
        string scriptsRoot,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var hasEmployee = await TableExistsAsync(connection, "Employee", cancellationToken);
        var hasSkillView = await ViewExistsAsync(connection, "v_employee_skill", cancellationToken);
        var hasPositionView = await ViewExistsAsync(connection, "v_employee_position", cancellationToken);
        var hasRoles = await TableExistsAsync(connection, "Roles", cancellationToken);
        var hasEvalView = await ViewExistsAsync(connection, "VEmployeeDetails", cancellationToken);

        if (!hasEmployee)
        {
            logger.LogInformation("Schéma absent — création des tables GCC.");
            await ExecuteScriptFileAsync(connection, scriptsRoot, CreationScript, splitBatches: false, logger, cancellationToken);
        }

        await ApplyViewCompatibilityColumnsAsync(connection, logger, cancellationToken);

        var needsViews = !hasSkillView || !hasPositionView;
        if (!hasEmployee || needsViews)
        {
            logger.LogInformation("Création / mise à jour des vues GCC.");
            await ExecuteScriptFileAsync(connection, scriptsRoot, ViewsScript, splitBatches: true, logger, cancellationToken);
        }
        else
        {
            logger.LogInformation("Tables et vues GCC déjà présentes.");
        }

        if (!hasRoles)
        {
            logger.LogInformation("Création des tables du module évaluations.");
            await ExecuteScriptFileAsync(connection, scriptsRoot, EvalTablesScript, splitBatches: false, logger, cancellationToken);
        }

        await ApplyViewCompatibilityColumnsAsync(connection, logger, cancellationToken);

        if (!hasEvalView)
        {
            logger.LogInformation("Création des vues du module évaluations.");
            await ExecuteScriptFileAsync(connection, scriptsRoot, EvalViewsScript, splitBatches: false, logger, cancellationToken);
        }
    }

    /// <summary>
    /// Recrée VEmployeeDetails pour la notation : dossiers soumis (state = 20), pas planifiés (10).
    /// L'ancienne vue faisait disparaître le salarié dès qu'il validait le portail.
    /// </summary>
    private static async Task EnsureVEmployeeDetailsSubmittedStateAsync(
        SqlConnection connection,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (!await ViewExistsAsync(connection, "VEmployeeDetails", cancellationToken)
            || !await TableExistsAsync(connection, "Evaluations", cancellationToken)
            || !await TableExistsAsync(connection, "Employee", cancellationToken))
        {
            return;
        }

        logger.LogInformation("Mise à jour de VEmployeeDetails (évaluations soumises, state = 20).");
        await ExecuteSqlAsync(connection, "DROP VIEW IF EXISTS dbo.VEmployeeDetails;", cancellationToken);
        await ExecuteSqlAsync(connection, """
            CREATE VIEW dbo.VEmployeeDetails AS
            SELECT
                e.Employee_id AS EmployeeId,
                e.FirstName AS FirstName,
                e.Name AS LastName,
                ISNULL(ep.Position_name, N'Non défini') AS Position,
                ISNULL(ep.Position_id, 0) AS PositionId,
                CAST(NULL AS nvarchar(255)) AS Role,
                d.Department_name AS Department,
                ev.Evaluations_id AS EvaluationId,
                ev.start_date AS EvaluationDate,
                ev.overallScore AS OverallScore,
                ev.comments AS EvaluationComments,
                ev.isServiceApproved AS IsServiceApproved,
                ev.isDgApproved AS IsDgApproved,
                et.designation AS EvaluationType,
                ev.strengths AS strengths,
                ev.weaknesses AS weaknesses,
                ev.state AS state
            FROM Employee e
            LEFT JOIN Department d ON e.Department_id = d.Department_id
            LEFT JOIN v_employee_position ep ON e.Employee_id = ep.Employee_id
            INNER JOIN Evaluations ev
                ON e.Employee_id = ev.employeeId
                AND ev.state = 20
                AND ev.Evaluations_id = (
                    SELECT MAX(ev2.Evaluations_id)
                    FROM Evaluations ev2
                    WHERE ev2.employeeId = e.Employee_id AND ev2.state = 20
                )
            LEFT JOIN Evaluation_type et ON ev.evaluationType_id = et.Evaluation_type_id;
            """, cancellationToken);
    }

    private static async Task ApplyViewCompatibilityColumnsAsync(
        SqlConnection connection,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        logger.LogInformation("Ajout des colonnes manquantes du schéma actuel (vues + EF).");
        var columns = new (string Table, string Column, string Definition)[]
        {
            ("Employee_skill", "Acquired_level", "INT NULL"),
            ("Employee_skill", "Skill_version_id", "INT NULL"),
            ("Employee_skill", "Source", "NVARCHAR(32) NULL"),
            ("Skill_position", "Expected_level", "INT NULL"),
            ("Skill_position", "Requirement_kind", "NVARCHAR(32) NULL"),
            ("Employee_education", "Start_date", "DATE NULL"),
            ("Employee_education", "Ending_date", "DATE NULL"),
            ("Employee", "Rib_number", "NVARCHAR(100) NULL"),
            ("Employee", "Bank_name", "NVARCHAR(100) NULL"),
            ("Department", "state", "INT NULL"),
            ("Department", "Establishment_id", "INT NULL"),
            ("Position", "state", "INT NULL"),
            ("Position", "Department_id", "INT NULL"),
            ("Position", "Professional_category_id", "INT NULL"),
            ("Position", "Legal_class_id", "INT NULL"),
            ("Legal_class", "Professional_category_id", "INT NULL"),
            ("Legal_class", "Min_salary", "DECIMAL(18,2) NULL"),
            ("Permissions", "state", "INT NOT NULL CONSTRAINT DF_Permissions_state DEFAULT 1"),
            ("Roles", "state", "INT NULL"),
            ("Evaluation_type", "state", "INT NULL"),
            ("Users", "username", "NVARCHAR(255) NULL"),
            ("Users", "employee_id", "INT NULL"),
        };

        foreach (var (table, column, definition) in columns)
        {
            await ExecuteSqlAsync(connection, $"""
                IF OBJECT_ID(N'dbo.{table}', N'U') IS NOT NULL
                   AND COL_LENGTH(N'dbo.{table}', N'{column}') IS NULL
                    ALTER TABLE dbo.[{table}] ADD [{column}] {definition};
                """, cancellationToken);
        }

        await ExecuteSqlAsync(connection, """
            IF OBJECT_ID(N'dbo.Skill_position', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.Skill_position', N'Weight') IS NULL
                ALTER TABLE dbo.Skill_position ADD Weight DECIMAL(9,4) NOT NULL CONSTRAINT DF_Skill_position_Weight DEFAULT 1;
            """, cancellationToken);
    }

    private static bool IsConnectivityError(SqlException ex) =>
        ex.Number is 2 or 20 or 40 or 53 or 64 or 233 or -1 or -2 or 18452 or 18456 or 4060 or 10054 or 10061;

    private static async Task EnsureDatabaseExistsAsync(
        string connectionString,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = string.IsNullOrWhiteSpace(builder.InitialCatalog) ? "Soft_GCC" : builder.InitialCatalog;
        builder.InitialCatalog = "master";

        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync(cancellationToken);

        var sql = $"""
            IF DB_ID(N'{EscapeSqlLiteral(databaseName)}') IS NULL
            BEGIN
                DECLARE @sql nvarchar(max) = N'CREATE DATABASE [{databaseName.Replace("]", "]]")}]';
                EXEC (@sql);
            END
            """;

        await ExecuteSqlAsync(connection, sql, cancellationToken);
        logger.LogInformation("Base {Database} vérifiée / créée.", databaseName);
    }

    private static async Task<bool> TableExistsAsync(
        SqlConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT CASE WHEN OBJECT_ID(@name, N'U') IS NULL THEN 0 ELSE 1 END";
        command.Parameters.AddWithValue("@name", tableName);
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result) == 1;
    }

    private static async Task<bool> ViewExistsAsync(
        SqlConnection connection,
        string viewName,
        CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = "SELECT CASE WHEN OBJECT_ID(@name, N'V') IS NULL THEN 0 ELSE 1 END";
        command.Parameters.AddWithValue("@name", viewName);
        var result = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(result) == 1;
    }

    private static async Task EnsureEstablishmentColumnsAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        await ExecuteSqlAsync(connection, """
            IF OBJECT_ID(N'dbo.Establishment', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.Establishment', N'Nif') IS NULL
                ALTER TABLE dbo.Establishment ADD Nif NVARCHAR(50) NULL;
            """, cancellationToken);
        await ExecuteSqlAsync(connection, """
            IF OBJECT_ID(N'dbo.Establishment', N'U') IS NOT NULL
               AND COL_LENGTH(N'dbo.Establishment', N'Stat') IS NULL
                ALTER TABLE dbo.Establishment ADD Stat NVARCHAR(50) NULL;
            """, cancellationToken);
    }

    private static async Task EnsureAdminUserAsync(
        ApplicationDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (await context.Users.AnyAsync(cancellationToken))
        {
            logger.LogInformation("Des utilisateurs existent déjà — admin local non créé.");
            return;
        }

        if (!await context.Roles.AnyAsync(r => r.Roleid == 1, cancellationToken))
        {
            logger.LogWarning("Rôle Admin (id=1) absent — impossible de créer admin@local.");
            return;
        }

        context.Users.Add(new User
        {
            LastName = "Admin",
            FirstName = "Local",
            Email = DefaultAdminEmail,
            Username = "admin",
            Password = BCrypt.Net.BCrypt.HashPassword(DefaultAdminPassword),
            RoleId = 1,
            Createdby = 1,
            CreationDate = DateTime.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Utilisateur local créé : {Email} (mot de passe : voir README)",
            DefaultAdminEmail);
    }

    private static async Task ExecuteScriptFileAsync(
        SqlConnection connection,
        string scriptsRoot,
        string relativePath,
        bool splitBatches,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var fullPath = Path.Combine(scriptsRoot, relativePath);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException($"Script SQL introuvable : {fullPath}");
        }

        logger.LogInformation("Exécution de {Script}.", relativePath);
        var sql = await File.ReadAllTextAsync(fullPath, cancellationToken);
        if (splitBatches)
            sql = MakeBatchObjectsIdempotent(sql);
        foreach (var batch in SplitSqlBatches(sql, splitBatches))
        {
            try
            {
                await ExecuteSqlAsync(connection, batch, cancellationToken);
            }
            catch (SqlException ex)
            {
                var preview = batch.Length <= 180 ? batch : batch[..180] + "…";
                throw new InvalidOperationException(
                    $"Échec du script {relativePath} : {ex.Message.Trim()} — lot : {preview.ReplaceLineEndings(" ")}",
                    ex);
            }
        }
    }

    private static async Task ExecuteSqlAsync(SqlConnection connection, string sql, CancellationToken cancellationToken)
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.CommandTimeout = 180;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    internal static IEnumerable<string> SplitSqlBatches(string sql, bool splitBatchObjects)
    {
        sql = Regex.Replace(sql, @"(?im)^\s*USE\s+\w+\s*;?\s*$", string.Empty, RegexOptions.Multiline);

        foreach (var goPart in Regex.Split(sql, @"(?im)^\s*GO\s*;?\s*$", RegexOptions.Multiline))
        {
            var trimmed = goPart.Trim();
            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            if (!splitBatchObjects)
            {
                yield return trimmed;
                continue;
            }

            foreach (var part in Regex.Split(
                         trimmed,
                         @"(?im)(?=^CREATE(?:\s+OR\s+ALTER)?\s+(?:VIEW|PROCEDURE|PROC|TRIGGER)\b)",
                         RegexOptions.Multiline))
            {
                var objectTrimmed = part.Trim();
                if (!string.IsNullOrWhiteSpace(objectTrimmed))
                    yield return objectTrimmed;
            }
        }
    }

    private static string MakeBatchObjectsIdempotent(string sql)
    {
        sql = Regex.Replace(
            sql,
            @"(?im)^CREATE\s+VIEW\b",
            "CREATE OR ALTER VIEW");
        sql = Regex.Replace(
            sql,
            @"(?im)^CREATE\s+PROCEDURE\b",
            "CREATE OR ALTER PROCEDURE");
        sql = Regex.Replace(
            sql,
            @"(?im)^CREATE\s+TRIGGER\b",
            "CREATE OR ALTER TRIGGER");
        return sql;
    }

    private static string EscapeSqlLiteral(string value) => value.Replace("'", "''");
}
