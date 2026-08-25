using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Domain_skill")]
	public class DomainSkill
	{
		[Key]
		[Column("Domain_skill_id")]
		public int DomainSkillId { get; set; }

		[Column("Domain_skill_name")]
		[MaxLength(256)]
		public string? Name { get; set; }

		[Column("Code")]
		[MaxLength(64)]
		public string Code { get; set; } = string.Empty;

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Sort_order")]
		public int SortOrder { get; set; }

		[Column("State")]
		[MaxLength(32)]
		public string State { get; set; } = SkillLifecycle.Active;

		public ICollection<SkillFamily> Families { get; set; } = new List<SkillFamily>();
	}
}
