using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	public class VEmployeePosition
	{
		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Registration_number")]
		public string RegistrationNumber { get; set; }

		[Column("Name")]
		public string Name { get; set; }

		[Column("FirstName")]
		public string FirstName { get; set; }

		[Column("Department_id")]
		public int DepartmentId { get; set; }

		[Column("Department_name")]
		public string DepartmentName { get; set; }

		[Column("Civilite_id")]
		public int? civiliteId { get; set; }

		[Column("Civilite_name")]
		public string? CiviliteName { get; set; }

		[Column("Manager_id")]
		public int? ManagerId { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }

		[Column("Hiring_date")]
		public DateTime HiringDate { get; set; }

		[Column("Seniority")]
		public string? Seniority { get; set; }

        [Column("employee_photo")]
        public byte[]? Photo { get; set; }
    }
}
