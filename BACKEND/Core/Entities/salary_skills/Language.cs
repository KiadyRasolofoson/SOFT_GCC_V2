using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Language")]
	public class Language
	{
		[Key]
		[Column("Language_id")]
		public int LanguageId { get; set; }

		[Column("Language_name")]
		public string? Name { get; set; }
	}
}
