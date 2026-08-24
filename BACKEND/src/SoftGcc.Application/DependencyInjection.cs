using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Authorization.Handlers;
using SoftGcc.Application.Common.Behaviours;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Application.Common.Interfaces.AiAgent;
using SoftGcc.Application.Interfaces;
using SoftGcc.Application.Services;
using SoftGcc.Application.Services.AiAgent;
using SoftGcc.Application.Services.AiAgent.Tools;
using SoftGcc.Application.Services.career_plan;
using SoftGcc.Application.Services.crud_career;
using SoftGcc.Application.Services.dashboard;
using SoftGcc.Application.Services.EmployeeSync;
using SoftGcc.Application.Services.entrepriseOrg;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Application.Services.history;
using SoftGcc.Application.Services.license;
using SoftGcc.Application.Services.retirement;
using SoftGcc.Application.Services.salary_skills;
using SoftGcc.Application.Services.wish_evolution;

namespace SoftGcc.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        });
        services.AddValidatorsFromAssembly(assembly);

        services.AddScoped<IEmployeeEducationService, EmployeeEducationService>();
        services.AddScoped<ISchoolService, SchoolService>();
        services.AddScoped<IDegreeService, DegreeService>();
        services.AddScoped<IStudyPathService, StudyPathService>();
        services.AddScoped<ISkillService, SkillService>();
        services.AddScoped<IDomainSkillService, DomainSkillService>();
        services.AddScoped<IEmployeeSkillService, EmployeeSkillService>();
        services.AddScoped<ILanguageService, LanguageService>();
        services.AddScoped<IEmployeeLanguageService, EmployeeLanguageService>();
        services.AddScoped<IEmployeeOtherFormationService, EmployeeOtherFormationService>();
        services.AddScoped<IEmployeeService, EmployeeService>();
        services.AddScoped<IDepartmentService, DepartmentService>();
        services.AddScoped<ICareerPlanService, CareerPlanService>();
        services.AddScoped<IAssignmentTypeService, AssignmentTypeService>();
        services.AddScoped<IEchelonService, EchelonService>();
        services.AddScoped<IEmployeeTypeService, EmployeeTypeService>();
        services.AddScoped<IEstablishmentService, EstablishmentService>();
        services.AddScoped<IFonctionService, FonctionService>();
        services.AddScoped<IIndicationService, IndicationService>();
        services.AddScoped<ILegalClassService, LegalClassService>();
        services.AddScoped<INewsLetterTemplateService, NewsLetterTemplateService>();
        services.AddScoped<IPaymentMethodService, PaymentMethodService>();
        services.AddScoped<ICertificateTypeService, CertificateTypeService>();
        services.AddScoped<ICertificateHistoryService, CertificateHistoryService>();
        services.AddScoped<IProfessionalCategoryService, ProfessionalCategoryService>();
        services.AddScoped<ISocioCategoryProfessionalService, SocioCategoryProfessionalService>();
        services.AddScoped<IRetirementService, RetirementService>();
        services.AddScoped<ICiviliteService, CiviliteService>();
        services.AddScoped<IWishEvolutionService, WishEvolutionService>();
        services.AddScoped<IWishTypeService, WishTypeService>();
        services.AddScoped<IHistoryService, HistoryService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IOrgService, OrgService>();
        services.AddScoped<WorkCertificatesService>();

        services.AddScoped<EvaluationService>();
        services.AddScoped<IEvaluationService>(sp => sp.GetRequiredService<EvaluationService>());
        services.AddScoped<IEvaluationQuestionService>(sp => sp.GetRequiredService<EvaluationService>());
        services.AddScoped<IEvaluationTrainingSuggestionService>(sp => sp.GetRequiredService<EvaluationService>());
        services.AddScoped<IEvaluationResponseService>(sp => sp.GetRequiredService<EvaluationResponseService>());
        services.AddScoped<ICompetenceLineService>(sp => sp.GetRequiredService<CompetenceLineService>());
        services.AddScoped<IResponseTypeService>(sp => sp.GetRequiredService<ResponseTypeService>());
        services.AddScoped<ITrainingSuggestionImportService>(sp => sp.GetRequiredService<TrainingSuggestionService>());
        services.AddScoped<UserService>();
        services.AddScoped<EvaluationPlanningService>();
        services.AddScoped<EvaluationInterviewService>();
        services.AddScoped<RoleService>();
        services.AddScoped<PermissionService>();
        services.AddScoped<IModuleService, ModuleService>();
        services.AddScoped<CompetenceLineService>();
        services.AddScoped<CompetenceTrainingService>();
        services.AddScoped<EvaluationResponseService>();
        services.AddScoped<ReferenceAnswerService>();
        services.AddScoped<EvaluationCompetenceService>();
        services.AddScoped<TrainingSuggestionService>();
        services.AddScoped<ResponseTypeService>();
        services.AddScoped<EvaluationTypeService>();
        services.AddScoped<EvaluationDurationService>();
        services.AddScoped<EvaluationHistoryService>();
        services.AddScoped<EvaluationPortalService>();
        services.AddScoped<TemporaryAccountService>();
        services.AddScoped<ILicenseService, LicenseService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IEmployeeSyncService, EmployeeSyncService>();
        services.AddScoped<IManagerHierarchyService, ManagerHierarchyService>();
        services.AddScoped<ISensitiveDataFilterService, SensitiveDataFilterService>();
        services.AddScoped<IUserProfileService, UserProfileService>();

        services.AddScoped<IAiTool, SearchEmployeesTool>();
        services.AddScoped<IAiTool, GetEmployeeTool>();
        services.AddScoped<IAiTool, GetEmployeeSkillsTool>();
        services.AddScoped<IAiTool, GetEmployeeEducationTool>();
        services.AddScoped<IAiTool, GetEmployeeLanguagesTool>();
        services.AddScoped<IAiTool, GetEmployeeCareerTool>();
        services.AddScoped<IAiTool, SearchPositionsTool>();
        services.AddScoped<IAiTool, GetOrgChartTool>();
        services.AddScoped<IAiTool, GetDepartmentHeadcountTool>();
        services.AddScoped<IAiTool, SearchEvaluationsTool>();
        services.AddScoped<IAiTool, GetEvaluationTool>();
        services.AddScoped<IAiTool, SearchRetirementsTool>();
        services.AddScoped<IAiTool, SearchWishEvolutionsTool>();
        services.AddScoped<IAiTool, GetDashboardKpisTool>();
        services.AddScoped<IAiToolPermissionResolver, AiToolPermissionResolver>();
        services.AddScoped<IAiToolRegistry, AiToolRegistry>();
        services.AddScoped<IAiAgentService, AiAgentService>();

        services.AddScoped<IAuthorizationHandler, CanViewEvaluationHandler>();
        services.AddScoped<IAuthorizationHandler, CanEditEvaluationHandler>();
        services.AddScoped<IAuthorizationHandler, CanValidateEvaluationHandler>();
        services.AddScoped<IAuthorizationHandler, CanDelegateEvaluationHandler>();
        services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddSingleton<IAuthorizationMiddlewareResultHandler, FrenchAuthorizationMiddlewareResultHandler>();

        return services;
    }
}
