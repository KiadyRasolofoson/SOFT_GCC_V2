using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.entrepriseOrg
{
	public class VDepartmentEffective
	{
		[Column("Department_id")]
		public int? DepartmentId { get; set; }

		[Column("Department_name")]
		public string? DepartmentName { get; set; }

		[Column("N_employee")]
		public int? NEmployee { get; set; }

		[Column("Department_photo")]
		public byte[]? DepartmentPhoto { get; set; }
	}
}
