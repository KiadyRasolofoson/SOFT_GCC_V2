using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Legal_class")]
	public class LegalClass
	{
		[Key]
		[Column("Legal_class_id")]
		public int LegalClassId { get; set; }


		[Column("Legal_class_name")]
		public string? LegalClassName { get; set; }
	}
}
