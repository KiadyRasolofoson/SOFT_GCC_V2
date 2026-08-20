using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills
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
