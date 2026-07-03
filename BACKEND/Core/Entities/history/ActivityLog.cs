using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.history
{
	[Table("Activity_logs")]
	public class ActivityLog
	{
		[Key]
		[Column("Activity_log_id")]
		public int ActivityLogId { get; set; }

		[Column("UserId")]
		public int UserId { get; set; }

		[Column("Module")]
		public int Module { get; set; }

		[Column("Action")]
		public string Action { get; set; }

		[Column("Description")]
		public string Description { get; set; }

		[Column("Creation_date")]
		public DateTime Timestamp { get; set; }

		[Column("Metadata")]
		public string Metadata { get; set; }
	}
}
