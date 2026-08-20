using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.dashboard;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Entities.license;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;

namespace SoftGcc.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    public DbSet<StudyPath> StudyPaths { get; }
    public DbSet<School> Schools { get; }
    public DbSet<Degree> Degrees { get; }
    public DbSet<EmployeeEducation> EmployeeEducations { get; }
    public DbSet<Skill> Skill { get; }
    public DbSet<DomainSkill> DomainSkill { get; }
    public DbSet<EmployeeSkill> EmployeeSkill { get; }
    public DbSet<EmployeeLanguage> EmployeeLanguage { get; }
    public DbSet<Language> Language { get; }
    public DbSet<EmployeeOtherFormation> EmployeeOtherFormation { get; }
    public DbSet<Employee> Employee { get; }
    public DbSet<Department> Department { get; }
    public DbSet<VEmployee> VEmployee { get; }
    public DbSet<VEmployeeSkill> VEmployeeSkill { get; }
    public DbSet<VEmployeeEducation> VEmployeeEducation { get; }
    public DbSet<VEmployeeLanguage> VEmployeeLanguage { get; }
    public DbSet<VEmployeeOtherSkill> VEmployeeOtherSkill { get; }
    public DbSet<VSkills> VSkills { get; }
    public DbSet<ImageEntity> ImageEntity { get; }
    public DbSet<VStateNumber> VStateNumber { get; }
    public DbSet<CareerPlan> CareerPlan { get; }
    public DbSet<AssignmentType> AssignmentType { get; }
    public DbSet<Echelon> Echelon { get; }
    public DbSet<EmployeeType> EmployeeType { get; }
    public DbSet<Establishment> Establishment { get; }
    public DbSet<Fonction> Fonction { get; }
    public DbSet<Indication> Indication { get; }
    public DbSet<LegalClass> LegalClass { get; }
    public DbSet<NewsLetterTemplate> NewsLetterTemplate { get; }
    public DbSet<PaymentMethod> PaymentMethod { get; }
    public DbSet<Position> Position { get; }
    public DbSet<ProfessionalCategory> ProfessionalCategory { get; }
    public DbSet<SocioCategoryProfessional> SocioCategoryProfessional { get; }
    public DbSet<CertificateType> CertificateType { get; }
    public DbSet<CertificateHistory> CertificateHistory { get; }
    public DbSet<VAssignmentAppointment> VAssignmentAppointment { get; }
    public DbSet<VAssignmentAvailability> VAssignmentAvailability { get; }
    public DbSet<VAssignmentAdvancement> VAssignmentAdvancement { get; }
    public DbSet<VEmployeeCareer> VEmployeeCareer { get; }
    public DbSet<History> History { get; }
    public DbSet<Civilite> Civilite { get; }
    public DbSet<VEmployeePosition> VEmployeePosition { get; }
    public DbSet<WorkCertificates> WorkCertificates { get; }
    public DbSet<Role> Roles { get; }
    public DbSet<User> Users { get; }
    public DbSet<EvaluationType> EvaluationTypes { get; }
    public DbSet<Evaluation> Evaluations { get; }
    public DbSet<EvaluationQuestionnaire> EvaluationQuestionnaires { get; }
    public DbSet<TrainingSuggestion> TrainingSuggestions { get; }
    public DbSet<EvaluationHistory> EvaluationHistories { get; }
    public DbSet<PerformanceEvolution> PerformanceEvolutions { get; }
    public DbSet<EvaluationQuestion> evaluationQuestions {  get; set; }
    public DbSet<EvaluationInterviews> evaluationInterviews { get; }
    public DbSet<InterviewParticipants> interviewParticipants { get; }
    public DbSet<EvaluationSupervisors> EvaluationSupervisors { get; }
    public DbSet<Permission> Permissions { get; }
    public DbSet<RolePermission> rolePermissions { get; }
    public DbSet<Module> Modules { get; }
    public DbSet<RoleModule> RoleModules { get; }
    public DbSet<CompetenceLine> competenceLines { get; }
    public DbSet<CompetenceTraining> competenceTrainings { get; }
    public DbSet<EvaluationSelectedQuestions> evaluationSelectedQuestions { get; }
    public DbSet<EvaluationResponses> evaluationResponses { get; }
    public DbSet<EvaluationQuestionOptions> evaluationQuestionOptions { get; }
    public DbSet<EvaluationReferenceAnswer> evaluationReferenceAnswers { get; }
    public DbSet<EvaluationCompetenceResult> EvaluationCompetenceResults { get; }
    public DbSet<ResponseType> ResponseTypes { get; }
    public DbSet<EvaluationProgress> evaluationProgresses { get; }
    public DbSet<TemporaryAccount> temporaryAccounts { get; }
    public DbSet<LoginAttempt> loginAttempts { get; }
    public DbSet<EvaluationQuestionConfig> evaluationQuestionConfigs { get; }
    public DbSet<SyncLog> SyncLogs { get; }
    public DbSet<EvaluationStatusLog> EvaluationStatusLogs { get; }
    public DbSet<EvaluationDelegation> EvaluationDelegations { get; }
    public DbSet<AccessAuditLog> AccessAuditLogs { get; }
    public DbSet<VEmployeeDetails> VEmployeeDetails { get; }
    public DbSet<VEmployeeWithoutEvaluation> vEmployeeWithoutEvaluations { get; }
    public DbSet<VEmployeesFinishedEvaluation> vEmployeesFinishedEvaluations { get; }
    public DbSet<VEvaluationHistory> vEvaluationHistories { get; }
    public DbSet<VEmployeesOngoingEvaluation> vEmployeesOngoingEvaluations { get; }
    public DbSet<VEmployeeEvaluationProgress> vEmployeesEvaluationProgress { get; }
    public DbSet<VRetirement> VRetirement { get; }
    public DbSet<RetirementParameter> RetirementParameter { get; }
    public DbSet<WishType> WishType { get; }
    public DbSet<WishEvolutionCareer> WishEvolutionCareer { get; }
    public DbSet<VWishEvolution> VWishEvolution { get; }
    public DbSet<VStatWishEvolution> VStatWishEvolution { get; }
    public DbSet<PcdSuggestionPosition> PcdSuggestionPosition { get; }
    public DbSet<VSkillPosition> VSkillPosition { get; }
    public DbSet<VNEmployeeSkillByDepartment> VNEmployeeSkillByDepartment { get; }
    public DbSet<VNEmployeeCareerByDepartment> VNEmployeeCareerByDepartment { get; }
    public DbSet<VEmployeeAgeDistribution> VEmployeeAgeDistribution { get; }
    public DbSet<VEmployeeExperienceDistribution> VEmployeeExperienceDistribution { get; }
    public DbSet<VDepartmentEffective> VDepartmentEffective { get; }
    public DbSet<TestCsv> TestCsv { get; }
    public DbSet<ActivityLog> ActivityLog { get; }
    public DbSet<License> Licenses { get; }
    public DbSet<Notification> Notifications { get; }

    DbSet<TEntity> Set<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
