using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.wish_evolution
{
	public class PcdSuggestionPosition
	{
		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }
	}
}
