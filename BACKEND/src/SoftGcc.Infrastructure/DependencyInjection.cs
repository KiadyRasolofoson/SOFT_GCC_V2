using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Domain.Interfaces.Evaluations;
using SoftGcc.Infrastructure.Identity;
using SoftGcc.Infrastructure.Persistence;
using SoftGcc.Infrastructure.Persistence.Repositories;
using SoftGcc.Infrastructure.Persistence.Repositories.Data;
using SoftGcc.Infrastructure.Persistence.Repositories.Evaluations;
using SoftGcc.Infrastructure.Services.AiAgent;
using SoftGcc.Infrastructure.Services.Background;
using SoftGcc.Infrastructure.Services.Email;
using SoftGcc.Infrastructure.Services.Files;
using SoftGcc.Infrastructure.Services.Pdf;
using SoftGcc.Application.Common.Interfaces.AiAgent;

namespace SoftGcc.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var defaultConnection = configuration["ConnectionStrings:DefaultConnection"];
        var payrollConnection = configuration["ConnectionStrings:P_SWConnection"];

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                defaultConnection,
                sql => sql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.GetName().Name)),
            ServiceLifetime.Scoped);

        services.AddDbContext<P_SWDbContext>(options =>
            options.UseSqlServer(payrollConnection),
            ServiceLifetime.Scoped);

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IP_SWDbContext>(sp => sp.GetRequiredService<P_SWDbContext>());

        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IEvaluationQuestionRepository, EvaluationQuestionRepository>();

        services.AddScoped<ISalarySkillDataService, SalarySkillDataService>();
        services.AddScoped<ICareerPlanDataService, CareerPlanDataService>();
        services.AddScoped<IDashboardDataService, DashboardDataService>();
        services.AddScoped<IOrgDataService, OrgDataService>();
        services.AddScoped<IRetirementDataService, RetirementDataService>();
        services.AddScoped<IHistoryDataService, HistoryDataService>();
        services.AddScoped<IWishEvolutionDataService, WishEvolutionDataService>();
        services.AddScoped<IEvaluationDataService, EvaluationDataService>();

        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IFileProcessingService, FileProcessingService>();
        services.AddScoped<PdfExtractionService>();
        services.AddSingleton<IRsaPublicKeyProvider, RsaPublicKeyProvider>();
        services.AddMemoryCache();

        services.AddSingleton<ISecretProtector, AesSecretProtector>();
        services.AddHttpClient("AiLlm", client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120);
        });
        services.AddSingleton<ILlmProviderFactory, LlmProviderFactory>();

        services.Configure<ReminderSettings>(configuration.GetSection("ReminderSettings"));
        services.AddScoped<ReminderBackgroundService>();
        services.AddHostedService<EmployeeSyncBackgroundService>();

        return services;
    }
}
