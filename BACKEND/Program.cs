using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using soft_carriere_competence.Infrastructure.Data;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Repositories;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Application.Services.salary_skills;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Services.career_plan;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Application.Services.crud_career;

using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Infrastructure.Repositories.EvaluationRepositories;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Infrastructure.Repositories.DataService;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Application.Services.retirement;
using soft_carriere_competence.Application.Services.wish_evolution;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Application.Services.EmailService;
using soft_carriere_competence.Core.Interface.AuthInterface;
using soft_carriere_competence.Application.Services.dashboard;
using soft_carriere_competence.Application.Services.entrepriseOrg;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Application.Services.history;
using soft_carriere_competence.Core.Entities.Evaluations;
using DocumentFormat.OpenXml.Office2016.Drawing.ChartDrawing;
using System.Configuration;

var builder = WebApplication.CreateBuilder(args);
//Connect base SQLSERVER


#region Injection independance
builder.Services.AddScoped<EmployeeEducationService>();
builder.Services.AddScoped<ICrudRepository<EmployeeEducation>, CrudRepository<EmployeeEducation>>();

builder.Services.AddScoped<SchoolService>();
builder.Services.AddScoped<ICrudRepository<School>, CrudRepository<School>>();

builder.Services.AddScoped<DegreeService>();
builder.Services.AddScoped<ICrudRepository<Degree>, CrudRepository<Degree>>();

builder.Services.AddScoped<StudyPathService>();
builder.Services.AddScoped<ICrudRepository<StudyPath>, CrudRepository<StudyPath>>();

builder.Services.AddScoped<SkillService>();
builder.Services.AddScoped<ICrudRepository<Skill>, CrudRepository<Skill>>();

builder.Services.AddScoped<DomainSkillService>();
builder.Services.AddScoped<ICrudRepository<DomainSkill>, CrudRepository<DomainSkill>>();

builder.Services.AddScoped<EmployeeSkillService>();
builder.Services.AddScoped<ICrudRepository<EmployeeSkill>, CrudRepository<EmployeeSkill>>();

builder.Services.AddScoped<LanguageService>();
builder.Services.AddScoped<ICrudRepository<Language>, CrudRepository<Language>>();

builder.Services.AddScoped<EmployeeLanguageService>();
builder.Services.AddScoped<ICrudRepository<EmployeeLanguage>, CrudRepository<EmployeeLanguage>>();

builder.Services.AddScoped<EmployeeOtherFormationService>();
builder.Services.AddScoped<ICrudRepository<EmployeeOtherFormation>, CrudRepository<EmployeeOtherFormation>>();

builder.Services.AddScoped<EmployeeService>();
builder.Services.AddScoped<ICrudRepository<Employee>, CrudRepository<Employee>>();

builder.Services.AddScoped<DepartmentService>();
builder.Services.AddScoped<ICrudRepository<Department>, CrudRepository<Department>>();

builder.Services.AddScoped<CareerPlanService>();
builder.Services.AddScoped<ICrudRepository<CareerPlan>, CrudRepository<CareerPlan>>();

builder.Services.AddScoped<AssignmentTypeService>();
builder.Services.AddScoped<ICrudRepository<AssignmentType>, CrudRepository<AssignmentType>>();

builder.Services.AddScoped<EchelonService>();
builder.Services.AddScoped<ICrudRepository<Echelon>, CrudRepository<Echelon>>();

builder.Services.AddScoped<EmployeeTypeService>();
builder.Services.AddScoped<ICrudRepository<EmployeeType>, CrudRepository<EmployeeType>>();

builder.Services.AddScoped<EstablishmentService>();
builder.Services.AddScoped<ICrudRepository<Establishment>, CrudRepository<Establishment>>();

builder.Services.AddScoped<FonctionService>();
builder.Services.AddScoped<ICrudRepository<Fonction>, CrudRepository<Fonction>>();

builder.Services.AddScoped<IndicationService>();
builder.Services.AddScoped<ICrudRepository<Indication>, CrudRepository<Indication>>();

builder.Services.AddScoped<LegalClassService>();
builder.Services.AddScoped<ICrudRepository<LegalClass>, CrudRepository<LegalClass>>();

builder.Services.AddScoped<NewsLetterTemplateService>();
builder.Services.AddScoped<ICrudRepository<NewsLetterTemplate>, CrudRepository<NewsLetterTemplate>>();

builder.Services.AddScoped<PaymentMethodService>();
builder.Services.AddScoped<ICrudRepository<PaymentMethod>, CrudRepository<PaymentMethod>>();

builder.Services.AddScoped<PositionService>();
builder.Services.AddScoped<ICrudRepository<Position>, CrudRepository<Position>>();

builder.Services.AddScoped<CertificateTypeService>();
builder.Services.AddScoped<ICrudRepository<CertificateType>, CrudRepository<CertificateType>>();

builder.Services.AddScoped<CertificateHistoryService>();
builder.Services.AddScoped<ICrudRepository<CertificateHistory>, CrudRepository<CertificateHistory>>();

builder.Services.AddScoped<ProfessionalCategoryService>();
builder.Services.AddScoped<ICrudRepository<ProfessionalCategory>, CrudRepository<ProfessionalCategory>>();

builder.Services.AddScoped<SocioCategoryProfessionalService>();
builder.Services.AddScoped<ICrudRepository<SocioCategoryProfessional>, CrudRepository<SocioCategoryProfessional>>();

builder.Services.AddScoped<RetirementService>();
builder.Services.AddScoped<ICrudRepository<RetirementParameter>, CrudRepository<RetirementParameter>>();

builder.Services.AddScoped<CiviliteService>();
builder.Services.AddScoped<ICrudRepository<Civilite>, CrudRepository<Civilite>>();

builder.Services.AddScoped<WishEvolutionService>();
builder.Services.AddScoped<ICrudRepository<WishEvolutionCareer>, CrudRepository<WishEvolutionCareer>>();

builder.Services.AddScoped<WishTypeService>();
builder.Services.AddScoped<ICrudRepository<WishType>, CrudRepository<WishType>>();

builder.Services.AddScoped<HistoryService>();
builder.Services.AddScoped<ICrudRepository<ActivityLog>, CrudRepository<ActivityLog>>();

builder.Services.AddScoped<DashboardService>();

builder.Services.AddScoped<OrgService>();

builder.Services.AddScoped<WorkCertificatesService>();
builder.Services.AddScoped<ICrudRepository<WorkCertificates>, CrudRepository<WorkCertificates>>();

// EVALUATIONS
builder.Services.AddScoped<IGenericRepository<User>, GenericRepository<User>>();
builder.Services.AddScoped<EvaluationService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<EvaluationPlanningService>();
builder.Services.AddScoped<EvaluationInterviewService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
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
builder.Services.AddScoped<UserService>();
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

#endregion

#region Cors configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
               "http://localhost:5173",
               "http://localhost:5189/api"
           )
           .AllowAnyHeader()
           .AllowAnyMethod()
           .AllowCredentials();
    });
});
#endregion

#region dbContext
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration["ConnectionStrings:DefaultConnection"]), ServiceLifetime.Transient);

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
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
    };
});

builder.Services.AddAuthorization();
#endregion

#region Swagger
builder.Services.AddControllers();
    
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

app.UseAuthorization();

app.MapControllers();

app.Run();