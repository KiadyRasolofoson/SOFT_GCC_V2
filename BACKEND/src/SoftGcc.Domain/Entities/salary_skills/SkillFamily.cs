using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Skill_family")]
	public class SkillFamily
	{
		[Key]
		[Column("Family_id")]
		public int FamilyId { get; set; }

		[Column("Domain_skill_id")]
		public int DomainSkillId { get; set; }

		[Column("Code")]
		[MaxLength(64)]
		public string Code { get; set; } = string.Empty;

		[Column("Name")]
		[MaxLength(256)]
		public string Name { get; set; } = string.Empty;

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Sort_order")]
		public int SortOrder { get; set; }

		[Column("State")]
		[MaxLength(32)]
		public string State { get; set; } = SkillLifecycle.Active;

		[ForeignKey(nameof(DomainSkillId))]
		public DomainSkill Domain { get; set; } = null!;

		public ICollection<Skill> Skills { get; set; } = new List<Skill>();
	}
}
