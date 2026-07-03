using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
    public class VEmployeeEducation
    {
		[Column("Employee_education_id")]
		public int EmployeeEducationId { get; set; }

		[Column("Study_path_id")]
		public int StudyPathId { get; set; }

		[Column("Study_path_name")]
		public string? StudyPathName { get; set; }

		[Column("Degree_id")]
		public int DegreeId { get; set; }

		[Column("Degree_name")]
		public String? DegreeName { get; set; }

		[Column("School_id")]
		public int SchoolId { get; set; }

		[Column("School_name")]
		public String? SchoolName { get; set; }

		[Column("State")]
		public int? State { get; set; }

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

        [Column("Start_date")]
        public DateTime? StartDate { get; set; }

        [Column("Ending_date")]
        public DateTime? EndingDate { get; set; }
    }
}
