using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	public class VAssignmentAvailability
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

		[Column("Assigning_institution")]
		public string? AssigningInstitution { get; set; }

		[Column("Start_date")]
		public DateTime? StartDate { get; set; }

		[Column("End_date")]
		public DateTime? EndDate { get; set; }

		[Column("Reason")]
		public string? Reason { get; set; }

		[Column("career_state")]
		public string? CareerState { get; set; }

		[Column("state")]
		public int? State { get; set; }

		[Column("creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
