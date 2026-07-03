using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Professional_category")]
	public class ProfessionalCategory
	{
		[Key]
		[Column("Professional_category_id")]
		public int ProfessionalCategoryId { get; set; }


		[Column("Professional_category_name")]
		public string? ProfessionalCategoryName { get; set; }
	}
}
