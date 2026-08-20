using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Employee_other_formation")]
	public class EmployeeOtherFormation
	{
		[Key]
		[Column("Employee_other_formation_id")]
		public int EmployeeOtherFormationId { get; set; }

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Start_date")]
		public DateTime? StartDate { get; set; }

		[Column("End_date")]
		public DateTime? EndDate { get; set; }

		[Column("Comment")]
		public string? Comment { get; set; }

		[Column("State")]
		public int State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; } = DateTime.Now;

		[Column("Updated_date")]
		public DateTime? UpdateDate { get; set; } = DateTime.Now;

		[Column("Employee_id")]
		public int EmployeeId { get; set; }
	}
}
