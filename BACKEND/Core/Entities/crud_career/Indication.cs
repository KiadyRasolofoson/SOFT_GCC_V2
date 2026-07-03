using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Indication")]
	public class Indication
	{
		[Key]
		[Column("Indication_id")]
		public int IndicationId { get; set; }


		[Column("Indication_name")]
		public string? IndicationName { get; set; }
	}
}
