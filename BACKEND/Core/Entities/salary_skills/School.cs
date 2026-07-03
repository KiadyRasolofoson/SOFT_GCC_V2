using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("School")]
	public class School
	{
		[Key]
		[Column("School_id")]
		public int SchoolId { get; set; }

		[Column("School_name")]
		public string? Name { get; set; }
	}
}
