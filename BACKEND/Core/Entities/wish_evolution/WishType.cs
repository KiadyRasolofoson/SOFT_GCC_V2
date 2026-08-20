using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.wish_evolution
{
	[Table("Wish_type")]
	public class WishType
	{
		[Key]
		[Column("Wish_type_id")]
		public int WishTypeId { get; set; }

		[Column("Designation")]
		public string? Designation { get; set; }
	}
}
