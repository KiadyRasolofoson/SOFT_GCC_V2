using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.salary_skills
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
