using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.wish_evolution
{
	public class VSkillPosition
	{
		[Column("Skill_position_id")]
		public int? SkillPositionId { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }

		[Column("Skill_id")]
		public int? SkillId { get; set; }

		[Column("Skill_name")]
		public string? SkillName { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
