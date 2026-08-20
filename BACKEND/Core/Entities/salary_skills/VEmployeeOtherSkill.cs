using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
    public class VEmployeeOtherSkill
    {
		[Column("Employee_other_formation_id")]
		public int EmployeeOtherFormationId { get; set; }

		[Column("Description")]
		public String? Description { get; set; }

		[Column("Comment")]
		public string? Comment { get; set; }

		[Column("Start_date")]
		public DateTime StartDate { get; set; }

		[Column("End_date")]
		public DateTime EndDate { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime UpdatedDate { get; set; }

		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Registration_number")]
		public String? RegistrationNumber { get; set; }

		[Column("Name")]
		public String? Name { get; set; }

		[Column("FirstName")]
		public String? FirstName { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Department_name")]
		public String? DepartmentName { get; set; }

		[Column("Hiring_date")]
		public DateTime? HiringDate { get; set; }
	}
}
