using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("employee_education")]
	public class EmployeeEducation
	{
		[Key]
		[Column("Employee_education_id")]
		public int EmployeeEducationId { get; set; }

		[Column("Study_path_id")]
		public int StudyPathId { get; set; }

		[Column("Degree_id")]
		public int DegreeId { get; set; }

		[Column("School_id")]
		public int SchoolId { get; set; }

		[Column("State")]
		public int State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; } = DateTime.Now;

		[Column("Updated_date")]
		public DateTime? UpdateDate { get; set; } = DateTime.Now;

		[Column("Employee_id")]
		public int EmployeeId { get; set; }

        [Column("Start_date")]
        public DateTime? StartDate { get; set; }

        [Column("Ending_date")]
        public DateTime? EndingDate { get; set; }
    }
}
