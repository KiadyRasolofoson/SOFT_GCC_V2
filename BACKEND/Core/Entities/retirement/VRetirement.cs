using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.retirement
{
	public class VRetirement
	{
		[Key]
		[Column("Registration_number")]
		public string RegistrationNumber { get; set; }

		[Column("Civilite_id")]
		public int? CiviliteId { get; set; }

		[Column("Civilite_name")]
		public string? CiviliteName { get; set; }

		[Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public string? FirstName { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Hiring_date")]
		public DateTime? HiringDate { get; set; }

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

		[Column("Net_Salary")]
		public double? NetSalary { get; set; }

		[Column("Age")]
		public int? Age { get; set; }

		[Column("Date_retirement")]
		public DateTime? DateDepart { get; set; }

		[Column("Year_retirement")]
		public int? YearRetirement { get; set; }
	}
}
