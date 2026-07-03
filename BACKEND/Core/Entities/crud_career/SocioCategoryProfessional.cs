using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Socio_category_professional")]
	public class SocioCategoryProfessional
	{
		[Key]
		[Column("Socio_category_professional_id")]
		public int SocioCategoryProfessionalId { get; set; }


		[Column("Socio_category_professional_name")]
		public string? SocioCategoryProfessionalName { get; set; }
	}
}
