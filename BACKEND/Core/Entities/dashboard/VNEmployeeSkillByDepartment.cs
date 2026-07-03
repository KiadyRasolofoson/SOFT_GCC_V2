using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.dashboard
{
	public class VNEmployeeSkillByDepartment
	{
		[Column("Skill_name")]
		public string? SkillName { get; set; }

		[Column("Skill_id")]
		public int? SkillId { get; set; }

		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("Department_id")]
		public int? DepartmentId { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("n_employee")]
		public int? NEmployee { get; set; }
	}
}
