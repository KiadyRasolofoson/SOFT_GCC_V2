using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Domain.Entities.wish_evolution
{
	[Table("Skill_position")]
	public class SkillPosition
	{
		[Key]
		[Column("Skill_position_id")]
		public int SkillPositionId { get; set; }

		[Column("Position_id")]
		public int PositionId { get; set; }

		[Column("Skill_id")]
		public int SkillId { get; set; }

		[Column("Expected_level")]
		public int ExpectedLevel { get; set; } = 2;

		[Column("Requirement_kind")]
		[MaxLength(32)]
		public string RequirementKind { get; set; } = SoftGcc.Domain.SkillReferential.RequirementKind.Required;

		[Column("Weight")]
		public decimal Weight { get; set; } = 1;

		[Column("Required_level")]
		public double? RequiredLevel { get; set; }

		[Column("State")]
		public int State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }

		[ForeignKey(nameof(PositionId))]
		public Position Position { get; set; } = null!;

		[ForeignKey(nameof(SkillId))]
		public Skill Skill { get; set; } = null!;
	}
}
