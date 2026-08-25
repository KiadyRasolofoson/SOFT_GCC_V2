using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Skill_version")]
	public class SkillVersion
	{
		[Key]
		[Column("Skill_version_id")]
		public int SkillVersionId { get; set; }

		[Column("Skill_id")]
		public int SkillId { get; set; }

		[Column("Version")]
		public int Version { get; set; }

		[Column("Name")]
		[MaxLength(256)]
		public string Name { get; set; } = string.Empty;

		[Column("Definition")]
		public string Definition { get; set; } = string.Empty;

		[Column("Category")]
		[MaxLength(32)]
		public string Category { get; set; } = string.Empty;

		[Column("Valid_from")]
		public DateTime ValidFrom { get; set; }

		[Column("Valid_to")]
		public DateTime? ValidTo { get; set; }

		[Column("Published_at")]
		public DateTime PublishedAt { get; set; }

		[Column("Published_by_user_id")]
		public int? PublishedByUserId { get; set; }

		[ForeignKey(nameof(SkillId))]
		public Skill Skill { get; set; } = null!;
	}
}
