using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Newsletter_template")]
	public class NewsLetterTemplate
	{
		[Key]
		[Column("Newsletter_template_id")]
		public int NewsletterTemplateId { get; set; }


		[Column("Newsletter_template_name")]
		public string? NewsletterTemplateName { get; set; }
	}
}
