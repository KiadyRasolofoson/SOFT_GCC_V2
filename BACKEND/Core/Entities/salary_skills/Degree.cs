using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Degree")]
	public class Degree
	{
		[Key]
		[Column("Degree_id")]
		public int DegreeId { get; set; }

		[Column("Degree_name")]
		public string? Name { get; set; }
	}
}
