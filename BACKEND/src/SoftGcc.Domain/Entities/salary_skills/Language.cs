using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.salary_skills
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
