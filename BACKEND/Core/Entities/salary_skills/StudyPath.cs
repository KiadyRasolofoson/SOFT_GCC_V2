using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Study_path")]
	public class StudyPath
	{
		[Key]
		[Column("Study_path_id")]
		public int StudyPathId { get; set; }

		[Column("Study_path_name")]
		public string? StudyPathName { get; set; }
	}
}
