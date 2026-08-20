using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Domain_skill")]
	public class DomainSkill
	{
		[Key]
		[Column("Domain_skill_id")]
		public int DomainSkillId { get; set; }

		[Column("Domain_skill_name")]
		public string? Name { get; set; }
	}
}
