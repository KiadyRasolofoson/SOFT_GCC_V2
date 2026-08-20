using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.wish_evolution
{
	public class VStatWishEvolution
	{
		[Column("Year")]
		public int? Year { get; set; }

		[Column("Month")]
		public int? Month { get; set; }

		[Column("Total_requests")]
		public int? TotalRequests { get; set; }

		[Column("Average_priority")]
		public double? AveragePriority { get; set; }
	}
}
