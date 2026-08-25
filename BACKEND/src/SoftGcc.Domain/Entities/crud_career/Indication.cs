using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.crud_career
{
	[Table("Indication")]
	public class Indication
	{
		[Key]
		[Column("Indication_id")]
		public int IndicationId { get; set; }


		[Column("Indication_name")]
		public string? IndicationName { get; set; }

		[Column("Legal_class_id")]
		public int? LegalClassId { get; set; }

		[Column("Indication_value")]
		public decimal? IndicationValue { get; set; }

		[Column("Point_value")]
		public decimal? PointValue { get; set; }
	}
}
