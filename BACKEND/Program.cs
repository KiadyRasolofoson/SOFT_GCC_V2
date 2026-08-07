using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Repositories;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Application.Services.salary_skills;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Services.career_plan;
using soft_carriere_competence.Application.Services.license;
using soft_carriere_competence.Middleware;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Services.crud_career;

using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Infrastructure.Repositories.EvaluationRepositories;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Infrastructure.Repositories.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Application.Services.wish_evolution;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Application.Services.EmailService;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Application.Services.dashboard;
using soft_carriere_competence.Application.Services.entrepriseOrg;
using soft_carriere_competence.Application.Authorization;
using soft_carriere_competence.Application.Authorization.Handlers;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Core.Entities.Evaluations;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using System.Configuration;
using soft_carriere_competence.Hubs;
using soft_carriere_competence.Core.Interface.ServiceInterface;
using soft_carriere_competence.Application.Services;
using soft_carriere_competence.Core.Entities;

var builder = WebApplication.CreateBuilder(args);
//Connect base SQLSERVER


#region Injection independance
builder.Services.AddScoped<IEmployeeEducationService, EmployeeEducationService>();
builder.Services.AddScoped<IGenericRepository<EmployeeEducation>, GenericRepository<EmployeeEducation>>();

builder.Services.AddScoped<ISchoolService, SchoolService>();
builder.Services.AddScoped<IGenericRepository<School>, GenericRepository<School>>();

builder.Services.AddScoped<IDegreeService, DegreeService>();
builder.Services.AddScoped<IGenericRepository<Degree>, GenericRepository<Degree>>();

builder.Services.AddScoped<IStudyPathService, StudyPathService>();
builder.Services.AddScoped<IGenericRepository<StudyPath>, GenericRepository<StudyPath>>();

builder.Services.AddScoped<ISkillService, SkillService>();
builder.Services.AddScoped<IGenericRepository<Skill>, GenericRepository<Skill>>();

builder.Services.AddScoped<IDomainSkillService, DomainSkillService>();
builder.Services.AddScoped<IGenericRepository<DomainSkill>, GenericRepository<DomainSkill>>();

builder.Services.AddScoped<IEmployeeSkillService, EmployeeSkillService>();
builder.Services.AddScoped<IGenericRepository<EmployeeSkill>, GenericRepository<EmployeeSkill>>();

builder.Services.AddScoped<ILanguageService, LanguageService>();
builder.Services.AddScoped<IGenericRepository<Language>, GenericRepository<Language>>();

builder.Services.AddScoped<IEmployeeLanguageService, EmployeeLanguageService>();
builder.Services.AddScoped<IGenericRepository<EmployeeLanguage>, GenericRepository<EmployeeLanguage>>();

builder.Services.AddScoped<IEmployeeOtherFormationService, EmployeeOtherFormationService>();
builder.Services.AddScoped<IGenericRepository<EmployeeOtherFormation>, GenericRepository<EmployeeOtherFormation>>();

builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddScoped<IGenericRepository<Employee>, GenericRepository<Employee>>();

builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<IGenericRepository<Department>, GenericRepository<Department>>();

builder.Services.AddScoped<ICareerPlanService, CareerPlanService>();
builder.Services.AddScoped<IGenericRepository<CareerPlan>, GenericRepository<CareerPlan>>();

builder.Services.AddScoped<IAssignmentTypeService, AssignmentTypeService>();
builder.Services.AddScoped<IGenericRepository<AssignmentType>, GenericRepository<AssignmentType>>();

builder.Services.AddScoped<IEchelonService, EchelonService>();
builder.Services.AddScoped<IGenericRepository<Echelon>, GenericRepository<Echelon>>();

builder.Services.AddScoped<IEmployeeTypeService, EmployeeTypeService>();
builder.Services.AddScoped<IGenericRepository<EmployeeType>, GenericRepository<EmployeeType>>();

builder.Services.AddScoped<IEstablishmentService, EstablishmentService>();
builder.Services.AddScoped<IGenericRepository<Establishment>, GenericRepository<Establishment>>();

builder.Services.AddScoped<IFonctionService, FonctionService>();
builder.Services.AddScoped<IGenericRepository<Fonction>, GenericRepository<Fonction>>();

builder.Services.AddScoped<IIndicationService, IndicationService>();
builder.Services.AddScoped<IGenericRepository<Indication>, GenericRepository<Indication>>();

builder.Services.AddScoped<ILegalClassService, LegalClassService>();
builder.Services.AddScoped<IGenericRepository<LegalClass>, GenericRepository<LegalClass>>();

builder.Services.AddScoped<INewsLetterTemplateService, NewsLetterTemplateService>();
builder.Services.AddScoped<IGenericRepository<NewsLetterTemplate>, GenericRepository<NewsLetterTemplate>>();

builder.Services.AddScoped<IPaymentMethodService, PaymentMethodService>();
builder.Services.AddScoped<IGenericRepository<PaymentMethod>, GenericRepository<PaymentMethod>>();

builder.Services.AddScoped<IPositionService, PositionService>();
builder.Services.AddScoped<IGenericRepository<Position>, GenericRepository<Position>>();

builder.Services.AddScoped<ICertificateTypeService, CertificateTypeService>();
builder.Services.AddScoped<IGenericRepository<CertificateType>, GenericRepository<CertificateType>>();

builder.Services.AddScoped<ICertificateHistoryService, CertificateHistoryService>();
builder.Services.AddScoped<IGenericRepository<CertificateHistory>, GenericRepository<CertificateHistory>>();

builder.Services.AddScoped<IProfessionalCategoryService, ProfessionalCategoryService>();
builder.Services.AddScoped<IGenericRepository<ProfessionalCategory>, GenericRepository<ProfessionalCategory>>();

builder.Services.AddScoped<ISocioCategoryProfessionalService, SocioCategoryProfessionalService>();
builder.Services.AddScoped<IGenericRepository<SocioCategoryProfessional>, GenericRepository<SocioCategoryProfessional>>();

builder.Services.AddScoped<IRetirementService, RetirementService>();
builder.Services.AddScoped<IGenericRepository<RetirementParameter>, GenericRepository<RetirementParameter>>();

builder.Services.AddScoped<ICiviliteService, CiviliteService>();
builder.Services.AddScoped<IGenericRepository<Civilite>, GenericRepository<Civilite>>();

builder.Services.AddScoped<IWishEvolutionService, WishEvolutionService>();
builder.Services.AddScoped<IGenericRepository<WishEvolutionCareer>, GenericRepository<WishEvolutionCareer>>();

builder.Services.AddScoped<IWishTypeService, WishTypeService>();
builder.Services.AddScoped<IGenericRepository<WishType>, GenericRepository<WishType>>();

builder.Services.AddScoped<IHistoryService, HistoryService>();
builder.Services.AddScoped<IGenericRepository<ActivityLog>, GenericRepository<ActivityLog>>();

builder.Services.AddScoped<IDashboardService, DashboardService>();

builder.Services.AddScoped<IOrgService, OrgService>();

builder.Services.AddScoped<WorkCertificatesService>();
builder.Services.AddScoped<IGenericRepository<WorkCertificates>, GenericRepository<WorkCertificates>>();

// EVALUATIONS
builder.Services.AddScoped<IGenericRepository<User>, GenericRepository<User>>();
builder.Services.AddScoped<EvaluationService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<EvaluationPlanningService>();
builder.Services.AddScoped<EvaluationInterviewService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<IModuleService, ModuleService>();
builder.Services.AddScoped<CompetenceLineService>();
builder.Services.AddScoped<CompetenceTrainingService>();
builder.Services.AddScoped<EvaluationResponseService>();
builder.Services.AddScoped<ReferenceAnswerService>();
builder.Services.AddScoped<EvaluationCompetenceService>();
builder.Services.AddScoped<TrainingSuggestionService>();
builder.Services.AddScoped<ResponseTypeService>();
builder.Services.AddScoped<EvaluationTypeService>();
builder.Services.AddScoped<EvaluationDurationService>();

builder.Services.AddScoped<IFileProcessingService, FileProcessingService>();
builder.Services.AddScoped<IEvaluationQuestionRepository, EvaluationQuestionRepository>();



builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<EvaluationHistoryService>();
builder.Services.AddScoped<EvaluationPortalService>();
builder.Services.AddScoped<ReminderBackgroundService>();
builder.Services.AddScoped<TemporaryAccountService>();

builder.Services.Configure<ReminderSettings>(builder.Configuration.GetSection("ReminderSettings"));

// Enregistrement des services
builder.Services.AddScoped<soft_carriere_competence.Application.Services.PDFExtraction.PdfExtractionService>();

// Data Services (abstraction layer for data access)
builder.Services.AddScoped<ISalarySkillDataService, SalarySkillDataService>();
builder.Services.AddScoped<ICareerPlanDataService, CareerPlanDataService>();
builder.Services.AddScoped<IDashboardDataService, DashboardDataService>();
builder.Services.AddScoped<IOrgDataService, OrgDataService>();
builder.Services.AddScoped<IRetirementDataService, RetirementDataService>();
builder.Services.AddScoped<IHistoryDataService, HistoryDataService>();
builder.Services.AddScoped<IWishEvolutionDataService, WishEvolutionDataService>();
builder.Services.AddScoped<IEvaluationDataService, EvaluationDataService>();

// License system
builder.Services.AddSingleton<RsaPublicKeyProvider>();
builder.Services.AddScoped<ILicenseService, LicenseService>();
builder.Services.AddMemoryCache();

// ========================================
// SignalR — Notifications temps réel
// ========================================
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IGenericRepository<Notification>, GenericRepository<Notification>>();

// Employee Sync (T_SAL p_sw → Employee Soft_GCC)
builder.Services.AddScoped<soft_carriere_competence.Core.Interface.ServiceInterface.IEmployeeSyncService, soft_carriere_competence.Application.Services.EmployeeSync.EmployeeSyncService>();
builder.Services.AddScoped<IGenericRepository<SyncLog>, GenericRepository<SyncLog>>();
builder.Services.AddHostedService<soft_carriere_competence.Application.Services.EmployeeSync.EmployeeSyncBackgroundService>();

// ========================================
// ABAC Authorization — Module Évaluation
// ========================================
builder.Services.AddScoped<IManagerHierarchyService, ManagerHierarchyService>();
builder.Services.AddScoped<ISensitiveDataFilterService, SensitiveDataFilterService>();

// Handlers
builder.Services.AddScoped<IAuthorizationHandler, CanViewEvaluationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, CanEditEvaluationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, CanValidateEvaluationHandler>();
builder.Services.AddScoped<IAuthorizationHandler, CanDelegateEvaluationHandler>();

#endregion

#region Cors configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
               "http://localhost:5173",
               "http://localhost:5189",
               "http://151.80.218.41",
               "http://151.80.218.41:5173",
               "http://151.80.218.41:5003",
               "http://151.80.218.41:80"
           )
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials();
    });
});
#endregion

#region dbContext
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration["ConnectionStrings:DefaultConnection"]), ServiceLifetime.Scoped);
builder.Services.AddDbContext<P_SWDbContext>(options => options.UseSqlServer(builder.Configuration["ConnectionStrings:P_SWConnection"]), ServiceLifetime.Scoped);

#endregion

#region Authentification JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
    };
});

builder.Services.AddAuthorization(options =>
{
    // RBAC baseline (existing roles) — applied to all modules
    // Aucune policy par défaut pour ne pas casser les modules existants

    // ABAC — Module Évaluation
    options.AddPolicy("CanViewEvaluation", policy =>
        policy.Requirements.Add(new CanViewEvaluationRequirement()));
    options.AddPolicy("CanEditEvaluation", policy =>
        policy.Requirements.Add(new CanEditEvaluationRequirement()));
    options.AddPolicy("CanValidateEvaluation", policy =>
        policy.Requirements.Add(new CanValidateEvaluationRequirement()));
    options.AddPolicy("CanDelegateEvaluation", policy =>
        policy.Requirements.Add(new CanDelegateEvaluationRequirement()));

    // Policy admin : restreint aux rôles Admin, RH, DG (role_id 1, 3, 4)
    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireAssertion(context =>
            context.User.HasClaim(c => c.Type == "roleId" &&
                (c.Value == "1" || c.Value == "3" || c.Value == "4"))));
});
#endregion

#region Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
    
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "TodoList API", Version = "v1" });

    // Ajouter la configuration pour le support de l'authentification JWT dans Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Veuillez entrer le token JWT ici. Exemple : Bearer <token>",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();
app.UseCors("AllowReactApp");
// Activer Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SOFTCARRIERE ET COMPETENCE API v1");
    });
}
#endregion

app.UseHttpsRedirection();
app.UseAuthentication();

// Middleware de vérification de licence
// Les chemins exclus sont configurés dans LicenseCheckMiddlewareOptions
// (par défaut : /api/auth, /api/license, /swagger, /health)
app.UseMiddleware<LicenseCheckMiddleware>();

app.UseAuthorization();

// SignalR Hub — Notifications temps réel
app.MapHub<NotificationHub>("/hubs/notification");

app.MapControllers();

app.Run();