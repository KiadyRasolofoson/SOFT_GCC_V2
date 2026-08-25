using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Employee")]
	public class Employee
	{
		[Key]
		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public string? FirstName { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Department_id")]
		public int? Department_id { get; set; }

		[Column("Hiring_date")]
		public DateTime? Hiring_date { get; set; }

		[Column("Civilite_id")]
		public int? CiviliteId { get; set; }

		[Column("Manager_id")]
		public int? ManagerId { get; set; }

		[Column("Photo")]
		public byte[]? Photo { get; set; }
		[Column("Email")]
        public string? Email { get; set; }

		[Column("Rib_number")]
		public string? RibNumber { get; set; }

		[Column("Bank_name")]
		public string? BankName { get; set; }
	}
}
