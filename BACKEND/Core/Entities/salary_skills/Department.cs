using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.salary_skills
{
	[Table("Department")]
	public class Department
	{
		[Key]
		[Column("Department_id")]
		public int DepartmentId { get; set; }

		[Column("Department_name")]
		public string? Name { get; set; }

		[Column("Photo")]
		public byte[]? Photo { get; set; }
	}
}
