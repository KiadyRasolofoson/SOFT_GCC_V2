using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Employee_language")]
	public class EmployeeLanguage
	{
		[Key]
		[Column("Employee_language_id")]
		public int EmployeeLanguageId { get; set; }

		[Column("Language_id")]
		public int Language_id { get; set; }

		[Column("Level")]
		public double Level { get; set; } = 0;

		[Column("State")]
		public int State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; } = DateTime.Now;

		[Column("Updated_date")]
		public DateTime? UpdateDate { get; set; } = DateTime.Now;

		[Column("Employee_id")]
		public int EmployeeId { get; set; }
	}
}
