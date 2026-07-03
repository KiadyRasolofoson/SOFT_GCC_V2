using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Controllers.Evaluations;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.dashboard;
using soft_carriere_competence.Core.Entities.entrepriseOrg;
using soft_carriere_competence.Core.Entities.Evaluations;

using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace soft_carriere_competence.Infrastructure.Data
{
	public class ApplicationDbContext : DbContext
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

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
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
			modelBuilder.Entity<VEmployeePosition>().ToView("v_employee_position");
			modelBuilder.Entity<VEmployeePosition>().HasNoKey();
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
        
    



			

