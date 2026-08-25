using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills
{
	[Table("Skill_level_descriptor")]
	public class SkillLevelDescriptor
	{
		[Key]
		[Column("Descriptor_id")]
		public int DescriptorId { get; set; }

		[Column("Skill_id")]
		public int SkillId { get; set; }

		[Column("Version")]
		public int Version { get; set; }

		[Column("Rank")]
		public int Rank { get; set; }

		[Column("Label")]
		[MaxLength(64)]
		public string Label { get; set; } = string.Empty;

		[Column("Behavioral_definition")]
		public string BehavioralDefinition { get; set; } = string.Empty;

		[ForeignKey(nameof(SkillId))]
		public Skill Skill { get; set; } = null!;
	}
}
