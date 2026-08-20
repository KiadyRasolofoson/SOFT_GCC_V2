using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	public class VAssignmentAppointment
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

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Establishment_name")]
		public string? EstablishmentName { get; set; }

		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }

		[Column("Employee_type_name")]
		public string? EmployeeTypeName { get; set; }

		[Column("Assignment_date")]
		public DateTime? AssignmentDate { get; set; }

		[Column("Ending_contract")]
		public DateTime? EndingContract { get; set; }

		[Column("Net_salary")]
		public double? NetSalary { get; set; }

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
