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

		[Column("State")]
		public int State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }

		[ForeignKey("PositionId")]
		public Position Position { get; set; } = null!;

		[ForeignKey("SkillId")]
		public Skill Skill { get; set; } = null!;
	}
}
