using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Employee_skill")]
	public class EmployeeSkill
	{
		[Key]
		[Column("Employee_skill_id")]
		public int EmployeeSkillId { get; set; }


		[Column("Domain_skill_id")]
		public int DomainSkillId { get; set; }

		[Column("Skill_id")]
		public int SkillId { get; set; }

		[Column("Level")]
		public double Level { get; set; } = 0;

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
