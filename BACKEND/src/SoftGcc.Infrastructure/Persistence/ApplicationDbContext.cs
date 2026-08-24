using Microsoft.EntityFrameworkCore;
using SoftGcc.Application.Common.Interfaces;
using SoftGcc.Domain.Entities.AiAgent;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.dashboard;
using SoftGcc.Domain.Entities.entrepriseOrg;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.license;
using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Entities;

namespace SoftGcc.Infrastructure.Persistence
{
	public class ApplicationDbContext : DbContext, IApplicationDbContext
	{
		public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
		{
		}

		// Competences
		public DbSet<StudyPath> StudyPaths { get; set; }
		public DbSet<School> Schools { get; set; }
		public DbSet<Degree> Degrees { get; set; }
		public DbSet<EmployeeEducation> EmployeeEducations { get; set; }
		public DbSet<Skill> Skill { get; set; }
		public DbSet<DomainSkill> DomainSkill { get; set; }
		public DbSet<EmployeeSkill> EmployeeSkill { get; set; }
		public DbSet<EmployeeLanguage> EmployeeLanguage { get; set; }
		public DbSet<Language> Language { get; set; }
		public DbSet<EmployeeOtherFormation> EmployeeOtherFormation { get; set; }
		public DbSet<Employee> Employee { get; set; }
		public DbSet<Department> Department { get; set; }
		public DbSet<VEmployee> VEmployee { get; set; }
		public DbSet<VEmployeeSkill> VEmployeeSkill { get; set; }
		public DbSet<VEmployeeEducation> VEmployeeEducation { get; set; }
		public DbSet<VEmployeeLanguage> VEmployeeLanguage { get; set; }
		public DbSet<VEmployeeOtherSkill> VEmployeeOtherSkill { get; set; }
		public DbSet<VSkills> VSkills { get; set; }
		public DbSet<ImageEntity> ImageEntity { get; set; }
        public DbSet<VStateNumber> VStateNumber { get; set; }

        // Carriere
        public DbSet<CareerPlan> CareerPlan { get; set; }
		public DbSet<AssignmentType> AssignmentType { get; set; }
		public DbSet<Echelon> Echelon { get; set; }
		public DbSet<EmployeeType> EmployeeType { get; set; }
		public DbSet<Establishment> Establishment { get; set; }
		public DbSet<Fonction> Fonction { get; set; }
		public DbSet<Indication> Indication { get; set; }
		public DbSet<LegalClass> LegalClass { get; set; }
		public DbSet<NewsLetterTemplate> NewsLetterTemplate { get; set; }
		public DbSet<PaymentMethod> PaymentMethod { get; set; }
		public DbSet<Position> Position { get; set; }
		public DbSet<ProfessionalCategory> ProfessionalCategory { get; set; }
		public DbSet<SocioCategoryProfessional> SocioCategoryProfessional { get; set; }
		public DbSet<CertificateType> CertificateType { get; set; }
        public DbSet<CertificateHistory> CertificateHistory { get; set; }
        public DbSet<VAssignmentAppointment> VAssignmentAppointment { get; set; }
		public DbSet<VAssignmentAvailability> VAssignmentAvailability { get; set; }
		public DbSet<VAssignmentAdvancement> VAssignmentAdvancement { get; set; }
		public DbSet<VEmployeeCareer> VEmployeeCareer { get; set; }
		public DbSet<History> History { get; set; }
		public DbSet<Civilite> Civilite { get; set; }
		public DbSet<VEmployeePosition> VEmployeePosition { get; set; }
        public DbSet<WorkCertificates> WorkCertificates { get; set; }

        //EVALUATIONS
        public DbSet<Role> Roles { get; set; }
		public DbSet<User> Users { get; set; }
		public DbSet<EvaluationType> EvaluationTypes { get; set; }
		public DbSet<Evaluation> Evaluations { get; set; }
		public DbSet<EvaluationQuestionnaire> EvaluationQuestionnaires { get; set; }
		public DbSet<TrainingSuggestion> TrainingSuggestions { get; set; }
		public DbSet<EvaluationHistory> EvaluationHistories { get; set; }
		public DbSet<PerformanceEvolution> PerformanceEvolutions { get; set; }
		public DbSet<EvaluationQuestion> evaluationQuestions {  get; set; }
		public DbSet<EvaluationInterviews> evaluationInterviews { get; set; }
		public DbSet<InterviewParticipants> interviewParticipants { get; set; }
		public DbSet<EvaluationSupervisors> EvaluationSupervisors { get; set; }
		public DbSet<Permission> Permissions { get; set; }
		public DbSet<RolePermission> rolePermissions { get; set; }
		public DbSet<Module> Modules { get; set; }
		public DbSet<RoleModule> RoleModules { get; set; }
		public DbSet<CompetenceLine> competenceLines { get; set; }
		public DbSet<CompetenceTraining> competenceTrainings { get; set; }
		public DbSet<EvaluationSelectedQuestions> evaluationSelectedQuestions { get; set; }
		public DbSet<EvaluationResponses> evaluationResponses { get; set; }
		public DbSet<EvaluationQuestionOptions> evaluationQuestionOptions { get; set; }
		public DbSet<EvaluationReferenceAnswer> evaluationReferenceAnswers { get; set; }
		public DbSet<EvaluationCompetenceResult> EvaluationCompetenceResults { get; set; }
		public DbSet<ResponseType> ResponseTypes { get; set; }

		public DbSet<EvaluationProgress> evaluationProgresses { get; set; }
		public DbSet<TemporaryAccount> temporaryAccounts { get; set; }
		public DbSet<LoginAttempt> loginAttempts { get; set; }
		public DbSet<EvaluationQuestionConfig> evaluationQuestionConfigs { get; set; }
		public DbSet<SyncLog> SyncLogs { get; set; }

		public DbSet<EvaluationStatusLog> EvaluationStatusLogs { get; set; }
		public DbSet<EvaluationDelegation> EvaluationDelegations { get; set; }
		public DbSet<AccessAuditLog> AccessAuditLogs { get; set; }

		public DbSet<VEmployeeDetails> VEmployeeDetails { get; set; }
		public DbSet<VEmployeeWithoutEvaluation> vEmployeeWithoutEvaluations { get; set; }
		public DbSet<VEmployeesFinishedEvaluation> vEmployeesFinishedEvaluations { get; set; }
		public DbSet<VEvaluationHistory> vEvaluationHistories { get; set; }
		public DbSet<VEmployeesOngoingEvaluation> vEmployeesOngoingEvaluations { get; set; }
		public DbSet<VEmployeeEvaluationProgress> vEmployeesEvaluationProgress { get; set; }

		// RETRAITE
		public DbSet<VRetirement> VRetirement { get; set; }
		public DbSet<RetirementParameter> RetirementParameter { get; set; }

		// SOUHAIT EVOLUTION
		public DbSet<WishType> WishType { get; set; }
		public DbSet<WishEvolutionCareer> WishEvolutionCareer { get; set; }
		public DbSet<VWishEvolution> VWishEvolution { get; set; }
		public DbSet<VStatWishEvolution> VStatWishEvolution { get; set; }
		public DbSet<PcdSuggestionPosition> PcdSuggestionPosition { get; set; }
		public DbSet<VSkillPosition> VSkillPosition { get; set; }

		// DASHBOARD
		public DbSet<VNEmployeeSkillByDepartment> VNEmployeeSkillByDepartment { get; set; }
		public DbSet<VNEmployeeCareerByDepartment> VNEmployeeCareerByDepartment { get; set; }
        public DbSet<VEmployeeAgeDistribution> VEmployeeAgeDistribution { get; set; }
        public DbSet<VEmployeeExperienceDistribution> VEmployeeExperienceDistribution { get; set; }

        // Organigramme et effectif
        public DbSet<VDepartmentEffective> VDepartmentEffective { get; set; }
		public DbSet<TestCsv> TestCsv { get; set; }

		// Historique d'activite
		public DbSet<ActivityLog> ActivityLog { get; set; }

		// Licence
		public DbSet<License> Licenses { get; set; }

		// Notifications
		public DbSet<Notification> Notifications { get; set; }

		// Agent IA
		public DbSet<AiAgentSetting> AiAgentSettings { get; set; }
		public DbSet<AiProviderConfig> AiProviderConfigs { get; set; }
		public DbSet<AiConversation> AiConversations { get; set; }
		public DbSet<AiMessage> AiMessages { get; set; }
		public DbSet<AiToolPermission> AiToolPermissions { get; set; }

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
		// Notification → User relationship
		modelBuilder.Entity<Notification>()
			.HasOne(n => n.User)
			.WithMany()
			.HasForeignKey(n => n.UserId)
			.OnDelete(DeleteBehavior.Cascade);

			// Index composite pour les requêtes de notifications non lues
			modelBuilder.Entity<Notification>()
				.HasIndex(n => new { n.UserId, n.IsRead });

			base.OnModelCreating(modelBuilder);

			// Module self-referencing relationship (parent → children)
			modelBuilder.Entity<Module>()
				.HasOne(m => m.ParentModule)
				.WithMany(m => m.ChildModules)
				.HasForeignKey(m => m.ParentModuleId)
				.OnDelete(DeleteBehavior.Restrict);

			// Permission → Module relationship
			modelBuilder.Entity<Permission>()
				.HasOne(p => p.Module)
				.WithMany(m => m.Permissions)
				.HasForeignKey(p => p.ModuleId)
				.OnDelete(DeleteBehavior.SetNull);

			// RoleModule → Role relationship
			modelBuilder.Entity<RoleModule>()
				.HasOne(rm => rm.Role)
				.WithMany()
				.HasForeignKey(rm => rm.RoleId)
				.OnDelete(DeleteBehavior.Cascade);

			// RoleModule → Module relationship
			modelBuilder.Entity<RoleModule>()
				.HasOne(rm => rm.Module)
				.WithMany(m => m.RoleModules)
				.HasForeignKey(rm => rm.ModuleId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<CareerPlan>()
			.ToTable(tb => tb.HasTrigger("trg_AfterInsert_CareerPlan"));

			// Configurer la vue comme une entité en lecture seule
			modelBuilder.Entity<VEmployee>().ToView("v_employee");
			modelBuilder.Entity<VEmployee>().HasNoKey();
			modelBuilder.Entity<VEmployeeSkill>().ToView("v_employee_skill"); 
			modelBuilder.Entity<VEmployeeSkill>().HasNoKey();
			modelBuilder.Entity<VEmployeeEducation>().ToView("v_employee_education");
			modelBuilder.Entity<VEmployeeEducation>().HasNoKey();
			modelBuilder.Entity<VEmployeeLanguage>().ToView("v_employee_language");
			modelBuilder.Entity<VEmployeeLanguage>().HasNoKey();
			modelBuilder.Entity<VEmployeeOtherSkill>().ToView("v_employee_other_formation");
			modelBuilder.Entity<VEmployeeOtherSkill>().HasNoKey();
			modelBuilder.Entity<VSkills>().ToView("v_skills");
			modelBuilder.Entity<VSkills>().HasNoKey();
			modelBuilder.Entity<VAssignmentAppointment>().ToView("v_assignment_appointment");
			modelBuilder.Entity<VAssignmentAppointment>().HasNoKey();
			modelBuilder.Entity<VAssignmentAdvancement>().ToView("v_assignment_advancement");
			modelBuilder.Entity<VAssignmentAdvancement>().HasNoKey();
			modelBuilder.Entity<VAssignmentAvailability>().ToView("v_assignment_availability");
			modelBuilder.Entity<VAssignmentAvailability>().HasNoKey();
			modelBuilder.Entity<VEmployeeCareer>().ToView("v_employee_career");
			modelBuilder.Entity<VEmployeeCareer>().HasNoKey();
			modelBuilder.Entity<VEmployeeCareer>(entity =>
			{
				// Colonnes date souvent NULL après sync p_sw — forcer le materializer nullable
				entity.Property(e => e.Birthday).IsRequired(false);
				entity.Property(e => e.HiringDate).IsRequired(false);
				entity.Property(e => e.AssignmentDate).IsRequired(false);
				entity.Property(e => e.DecisionDate).IsRequired(false);
				entity.Property(e => e.EndingContract).IsRequired(false);
				entity.Property(e => e.Name).IsRequired(false);
				entity.Property(e => e.FirstName).IsRequired(false);
				entity.Property(e => e.AssignmentTypeId).IsRequired(false);
			});
			modelBuilder.Entity<VRetirement>().ToView("v_retirement");
			modelBuilder.Entity<VRetirement>().HasNoKey();
			modelBuilder.Entity<VWishEvolution>().ToView("v_wish_evolution");
			modelBuilder.Entity<VWishEvolution>().HasNoKey();
			modelBuilder.Entity<VStatWishEvolution>().ToView("v_stat_wish_evolution");
			modelBuilder.Entity<VStatWishEvolution>().HasNoKey();
			modelBuilder.Entity<PcdSuggestionPosition>().ToView("pcd_GetSuggestionPosition");
			modelBuilder.Entity<PcdSuggestionPosition>().HasNoKey();
			modelBuilder.Entity<VSkillPosition>().ToView("v_skill_position");
			modelBuilder.Entity<VSkillPosition>().HasNoKey();
			modelBuilder.Entity<VEmployeePosition>(entity =>
			{
				entity.ToView("v_employee_position");
				entity.HasNoKey();
				// Colonnes de la vue peuvent être NULL (LEFT JOIN département / données incomplètes)
				entity.Property(e => e.RegistrationNumber).IsRequired(false);
				entity.Property(e => e.Name).IsRequired(false);
				entity.Property(e => e.FirstName).IsRequired(false);
				entity.Property(e => e.DepartmentName).IsRequired(false);
			});
            modelBuilder.Entity<VStateNumber>().ToView("v_state_number");
            modelBuilder.Entity<VStateNumber>().HasNoKey();



			//------------------EVALUATIONS-----------------------------------------//
			modelBuilder.Entity<VEmployeeDetails>().HasNoKey().ToView("VEmployeeDetails");
			modelBuilder.Entity<VEmployeeWithoutEvaluation>().HasNoKey().ToView("VEmployeesWithoutEvaluation");
			modelBuilder.Entity<VEmployeesFinishedEvaluation>().HasNoKey().ToView("VEmployeesFinishedEvaluation");
			modelBuilder.Entity<VEvaluationHistory>().HasNoKey().ToView("VEvaluationHistory");
			modelBuilder.Entity<VEmployeesOngoingEvaluation>().HasNoKey().ToView("VEmployeesOngoingEvaluation");
			modelBuilder.Entity<VEmployeeEvaluationProgress>().HasNoKey().ToView("VEmployeeEvaluationProgress");
            //------------------EVALUATIONS-----------------------------------------//
            modelBuilder.Entity<VEmployeeDetails>().HasNoKey().ToView("VEmployeeDetails");
            modelBuilder.Entity<VEmployeeWithoutEvaluation>().HasNoKey().ToView("VEmployeesWithoutEvaluation");
            modelBuilder.Entity<VEmployeesFinishedEvaluation>().HasNoKey().ToView("VEmployeesFinishedEvaluation");
            modelBuilder.Entity<VEvaluationHistory>().HasNoKey().ToView("VEvaluationHistory");
            modelBuilder.Entity<VEmployeesOngoingEvaluation>().HasNoKey().ToView("VEmployeesOngoingEvaluation");
            modelBuilder.Entity<VEmployeeEvaluationProgress>().HasNoKey().ToView("VEmployeeEvaluationProgress");

			//------------------DASHBOARD-------------------------------------------//
			modelBuilder.Entity<VNEmployeeSkillByDepartment>().ToView("v_n_employee_skill_by_department");
			modelBuilder.Entity<VNEmployeeSkillByDepartment>().HasNoKey();
			modelBuilder.Entity<VNEmployeeCareerByDepartment>().ToView("v_n_employee_career_by_department");
			modelBuilder.Entity<VNEmployeeCareerByDepartment>().HasNoKey();
            modelBuilder.Entity<VEmployeeAgeDistribution>().ToView("v_employee_age_distribution");
            modelBuilder.Entity<VEmployeeAgeDistribution>().HasNoKey();
            modelBuilder.Entity<VEmployeeExperienceDistribution>().ToView("v_employee_experience_distribution");
            modelBuilder.Entity<VEmployeeExperienceDistribution>().HasNoKey();

            //------------------ORGANIGRAMME ET EFFECTIF-------------------------------------------//
            modelBuilder.Entity<VDepartmentEffective>().ToView("v_department_effective");
			modelBuilder.Entity<VDepartmentEffective>().HasNoKey();

			// Configuration de la clé composite pour EvaluationSupervisors
			modelBuilder.Entity<EvaluationSupervisors>()
				.HasKey(es => new { es.EvaluationId, es.SupervisorId });

			ConfigureAiAgent(modelBuilder);
		}

		private static void ConfigureAiAgent(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<AiProviderConfig>()
				.HasIndex(p => p.Provider)
				.IsUnique();

			modelBuilder.Entity<AiConversation>()
				.HasOne(c => c.User)
				.WithMany()
				.HasForeignKey(c => c.UserId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<AiConversation>()
				.HasIndex(c => c.UserId);

			modelBuilder.Entity<AiMessage>()
				.HasOne(m => m.Conversation)
				.WithMany(c => c.Messages)
				.HasForeignKey(m => m.ConversationId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<AiToolPermission>()
				.HasOne(p => p.Role)
				.WithMany()
				.HasForeignKey(p => p.RoleId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<AiToolPermission>()
				.HasOne(p => p.User)
				.WithMany()
				.HasForeignKey(p => p.UserId)
				.OnDelete(DeleteBehavior.Cascade);

			modelBuilder.Entity<AiToolPermission>()
				.HasIndex(p => new { p.RoleId, p.ToolKey })
				.IsUnique()
				.HasFilter("[role_id] IS NOT NULL AND [user_id] IS NULL");

			modelBuilder.Entity<AiToolPermission>()
				.HasIndex(p => new { p.UserId, p.ToolKey })
				.IsUnique()
				.HasFilter("[user_id] IS NOT NULL AND [role_id] IS NULL");

			var seedAt = new DateTime(2026, 8, 20, 0, 0, 0, DateTimeKind.Unspecified);

			modelBuilder.Entity<AiAgentSetting>().HasData(new AiAgentSetting
			{
				Id = 1,
				ActiveProvider = "Deepseek",
				ActiveModel = "deepseek-chat",
				IsEnabled = false,
				MaxTokens = 2048,
				MaxToolRounds = 15,
				Temperature = 0.3,
				UpdatedAt = seedAt
			});

			modelBuilder.Entity<AiProviderConfig>().HasData(
				new AiProviderConfig { Id = 1, Provider = "Deepseek", BaseUrl = "https://api.deepseek.com", DefaultModel = "deepseek-chat", UpdatedAt = seedAt },
				new AiProviderConfig { Id = 2, Provider = "OpenAI", BaseUrl = "https://api.openai.com/v1", DefaultModel = "gpt-4o-mini", UpdatedAt = seedAt },
				new AiProviderConfig { Id = 3, Provider = "Ollama", BaseUrl = "http://localhost:11434/v1", DefaultModel = "llama3.1", UpdatedAt = seedAt },
				new AiProviderConfig { Id = 4, Provider = "Gemini", BaseUrl = "https://generativelanguage.googleapis.com/v1beta", DefaultModel = "gemini-2.0-flash", UpdatedAt = seedAt },
				new AiProviderConfig { Id = 5, Provider = "Claude", BaseUrl = "https://api.anthropic.com", DefaultModel = "claude-sonnet-4-20250514", UpdatedAt = seedAt }
			);
		}
	}

            //    // Configuration de la relation EvaluationInterviews - InterviewParticipants
            //    modelBuilder.Entity<InterviewParticipants>()
            //        .HasOne(p => p.Interview)
            //        .WithMany(i => i.Participants)
            //        .HasForeignKey(p => p.InterviewId)
            //        .OnDelete(DeleteBehavior.Cascade); // Cascade si nécessaire

            //    modelBuilder.Entity<InterviewParticipants>()
            //        .HasOne(p => p.User)
            //        .WithMany()
            //        .HasForeignKey(p => p.UserId)
            //        .OnDelete(DeleteBehavior.Restrict); // Pas de suppression d'utilisateur si le participant est supprimé
}
        
    



			

