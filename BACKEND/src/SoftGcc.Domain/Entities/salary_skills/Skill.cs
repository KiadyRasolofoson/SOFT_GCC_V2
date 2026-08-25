using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Skill")]
	public class Skill
	{
		[Key]
		[Column("Skill_id")]
		public int SkillId { get; set; }

		[Column("Skill_name")]
		[MaxLength(256)]
		public string? Name { get; set; }

		[Column("Code")]
		[MaxLength(64)]
		public string Code { get; set; } = string.Empty;

		[Column("Definition")]
		public string Definition { get; set; } = string.Empty;

		[Column("Category")]
		[MaxLength(32)]
		public string Category { get; set; } = SkillCategory.Transversal;

		[Column("Family_id")]
		public int FamilyId { get; set; }

		[Column("Current_version")]
		public int CurrentVersion { get; set; } = 1;

		[Column("State")]
		[MaxLength(32)]
		public string State { get; set; } = SkillLifecycle.Draft;

		[Column("Created_at")]
		public DateTime? CreatedAt { get; set; }

		[Column("Updated_at")]
		public DateTime? UpdatedAt { get; set; }

		[Column("Created_by_user_id")]
		public int? CreatedByUserId { get; set; }

		[Column("Published_at")]
		public DateTime? PublishedAt { get; set; }

		[ForeignKey(nameof(FamilyId))]
		public SkillFamily Family { get; set; } = null!;

		public ICollection<SkillVersion> Versions { get; set; } = new List<SkillVersion>();

		public ICollection<SkillLevelDescriptor> LevelDescriptors { get; set; } = new List<SkillLevelDescriptor>();

		public ICollection<SkillPosition> SkillPositions { get; set; } = new List<SkillPosition>();
	}
}
