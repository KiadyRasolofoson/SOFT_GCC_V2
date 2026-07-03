using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Skill")]
	public class Skill
	{
		[Key]
		[Column("Skill_id")]
		public int SkillId { get; set; }


		[Column("Skill_name")]
		public string? Name { get; set; }
	}
}
