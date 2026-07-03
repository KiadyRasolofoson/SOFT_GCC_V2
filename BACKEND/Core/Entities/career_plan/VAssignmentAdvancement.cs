using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	public class VAssignmentAdvancement
	{
		[Column("Career_plan_id")]
		public int? CareerPlanId { get; set; }

		[Column("Assignment_type_id")]
		public int? AssignmentTypeId { get; set; }

		[Column("Assignment_type_name")]
		public string? AssignmentTypeName { get; set; }

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

		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("Socio_category_professional_name")]
		public string? SocioCategoryProfessionalName { get; set; }

		[Column("Indication_name")]
		public string? IndicationName { get; set; }

		[Column("Echelon_name")]
		public string? EchelonName { get; set; }

		[Column("state")]
		public int? State { get; set; }

		[Column("creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
