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

		[Column("Legal_class_id")]
		public int? LegalClassId { get; set; }

		[Column("Indication_id")]
		public int? IndicationId { get; set; }

		[Column("Min_months")]
		public int? MinMonths { get; set; }
	}
}
