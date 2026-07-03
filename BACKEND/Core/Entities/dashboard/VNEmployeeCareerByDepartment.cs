using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.dashboard
{
	public class VNEmployeeCareerByDepartment
	{
		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("Department_id")]
		public int? DepartmentId { get; set; }

		[Column("Position_name")]
		public string? PositionName { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("n_employee")]
		public int? NEmployee { get; set; }
	}
}
