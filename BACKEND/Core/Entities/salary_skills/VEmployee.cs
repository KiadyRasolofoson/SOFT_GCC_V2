using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	public class VEmployee
    {
		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Registration_number")]
		public String? RegistrationNumber { get; set; }

		[Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public string? FirstName { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Department_id")]
		public int DepartmentId { get; set; }

		[Column("Department_name")]
		public String? DepartmentName { get; set; }

		[Column("hiring_date")]
		public DateTime? HiringDate { get; set; }

		[Column("Civilite_name")]
		public String? CiviliteName { get; set; }

		[Column("Manager_id")]
		public int? ManagerId { get; set; }

		[Column("Manager_name")]
		public string? ManagerName { get; set; }

		[Column("Manager_firstName")]
		public string? ManagerFirstName { get; set; }

		[Column("employee_photo")]
		public byte[]? Photo { get; set; }
	}
}
