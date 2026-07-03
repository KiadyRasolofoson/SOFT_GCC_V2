using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.retirement
{
	[Table("Retirement_parameter")]
	public class RetirementParameter
	{
		[Key]
		[Column("Retirement_parameter_id")]
		public int RetirementParameterId { get; set; }

		[Column("Woman_age")]
		public int? WomanAge { get; set; }

		[Column("Man_age")]
		public int? ManAge { get; set; }
	}
}
