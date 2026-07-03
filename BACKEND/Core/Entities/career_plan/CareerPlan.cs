using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	[Table("Career_plan")]
	public class CareerPlan
	{
		[Key]
		[Column("Career_plan_id")]
		public int CareerPlanId { get; set; }

		[Column("Assignment_type_id")]
		public int AssignmentTypeId { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("Decision_number")]
		public string? DecisionNumber { get; set; }

		[Column("Decision_date")]
		public DateTime? DecisionDate { get; set; }

		[Column("Assignment_date")]
		public DateTime? AssignmentDate { get; set; }

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Establishment_id")]
		public int? EstablishmentId { get; set; }

		[Column("Department_id")]
		public int? DepartmentId { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Fonction_id")]
		public int? FonctionId { get; set; }

		[Column("Employee_Type_id")]
		public int? EmployeeTypeId { get; set; }

		[Column("Socio_category_professional_id")]
		public int? SocioCategoryProfessionalId { get; set; }

		[Column("Indication_id")]
		public int? IndicationId { get; set; }

		[Column("Base_salary")]
		public double? BaseSalary { get; set; }

		[Column("Net_salary")]
		public double? NetSalary { get; set; }

		[Column("Professional_category_id")]
		public int? ProfessionalCategoryId { get; set; }

		[Column("Legal_class_id")]
		public int? LegalClassId { get; set; }

		[Column("Newsletter_template_id")]
		public int? NewsletterTemplateId { get; set; }

		[Column("Payment_method_id")]
		public int? PaymentMethodId { get; set; }

		[Column("Ending_contract")]
		public DateTime? EndingContract { get; set; }

		[Column("Reason")]
		public string? Reason { get; set; }

		[Column("Assigning_institution")]
		public string? AssigningInstitution { get; set; }

		[Column("Start_date")]
		public DateTime? StartDate { get; set; }

		[Column("End_date")]
		public DateTime? EndDate { get; set; }

		[Column("Echelon_id")]
		public int? EchelonId { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
