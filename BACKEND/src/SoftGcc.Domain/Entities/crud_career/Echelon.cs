using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.crud_career
{

	[Table("Echelon")]
	public class Echelon
	{
		[Key]
		[Column("Echelon_id")]
		public int EchelonId { get; set; }


		[Column("Echelon_name")]
		public string? EchelonName { get; set; }
	}
}
