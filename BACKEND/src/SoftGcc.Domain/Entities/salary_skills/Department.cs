using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.salary_skills
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

		[Column("Establishment_id")]
		public int? EstablishmentId { get; set; }
	}
}
