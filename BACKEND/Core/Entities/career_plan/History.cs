using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	[Table("History")]
	public class History
	{
		[Key]
		[Column("History_id")]
		public int HistoryId { get; set; }

		[Column("Module_id")]
		public int? ModuleId { get; set; }

		[Column("Description")]
		public string? Description { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime? DateCreation { get; set; }
	}
}
