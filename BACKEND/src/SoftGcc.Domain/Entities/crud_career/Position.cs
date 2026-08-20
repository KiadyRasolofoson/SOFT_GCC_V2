using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.crud_career
{
	[Table("Position")]
	public class Position
	{
		[Key]
		[Column("Position_id")]
		public int PositionId { get; set; }


		[Column("Position_name")]
		public string? PositionName { get; set; }

	}
}
