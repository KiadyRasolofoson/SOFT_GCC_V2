
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	public class VEmployeeCareer
	{
		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

        [Column("civilite_name")]
        public string CiviliteName { get; set; }

        [Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public string? FirstName { get; set; }

		[Column("Birthday")]
		public DateTime Birthday { get; set; }

		[Column("hiring_date")]
		public DateTime? HiringDate { get; set; }

		[Column("Assignment_type_id")]
		public int? AssignmentTypeId { get; set; }

		[Column("Decision_number")]
		public string? DecisionNumber { get; set; }

		[Column("Assignment_date")]
		public DateTime? AssignmentDate { get; set; }

		[Column("Decision_date")]
		public DateTime? DecisionDate { get; set; }

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Department_id")]
		public int? DepartmentId { get; set; }

		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }

		[Column("Base_salary")]
		public double? BaseSalary { get; set; }

		[Column("Net_salary")]
		public double? NetSalary { get; set; }

		[Column("Career_plan_number")]
		public int? CareerPlanNumber { get; set; }

        [Column("Establishment_id")]
        public int? EstablishmentId { get; set; }

        [Column("Ending_contract")]
        public DateTime? EndingContract { get; set; }

        [Column("email")]
        public string? Email { get; set; }
    }
}
