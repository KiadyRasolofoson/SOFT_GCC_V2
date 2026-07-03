using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
    public class VEmployeeLanguage
    {
		[Column("Employee_language_id")]
		public int EmployeeLanguageId { get; set; }

		[Column("Language_id")]
		public int LanguageId { get; set; }

		[Column("Language_name")]
		public string? LanguageName { get; set; }

		[Column("Level")]
		public double Level { get; set; }

		[Column("State")]
		public int State { get; set; }

		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Creation_date")]
		public DateTime CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime UpdatedDate { get; set; }

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
