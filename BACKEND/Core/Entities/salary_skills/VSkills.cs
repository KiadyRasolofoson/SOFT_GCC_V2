using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	public class VSkills
	{
		[Column("Employee_id")]
		public int EmployeeId { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public String? FirstName { get; set; }

		[Column("Department_name")]
		public String? DepartmentName { get; set; }

		[Column("Other_formation_number")]
		public int OtherFormationNumber { get; set; }

		[Column("Education_number")]
		public int EducationNumber { get; set; }

		[Column("Skill_number")]
		public int SkillNumber { get; set; }

		[Column("Language_number")]
		public int LanguageNumber { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Hiring_date")]
		public DateTime? HiringDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }

		[Column("employee_photo")]
		public byte[]? Photo { get; set; }
	}
}
