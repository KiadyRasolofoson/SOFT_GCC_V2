using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.crud_career
{
	[Table("Newsletter_template")]
	public class NewsLetterTemplate
	{
		[Key]
		[Column("Newsletter_template_id")]
		public int NewsletterTemplateId { get; set; }


		[Column("Newsletter_template_name")]
		public string? NewsletterTemplateName { get; set; }

		[Column("Employee_type_id")]
		public int? EmployeeTypeId { get; set; }

		[Column("Deduction_rate")]
		public decimal? DeductionRate { get; set; }
	}
}
