using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.retirement
{
	[Table("Civilite")]
	public class Civilite
	{
		[Key]
		[Column("Civilite_id")]
		public int CiviliteId { get; set; }

		[Column("Civilite_name")]
		public string? CiviliteName { get; set; }
	}
}
