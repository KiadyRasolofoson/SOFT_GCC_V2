using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Employee_type")]
	public class EmployeeType
	{
		[Key]
		[Column("Employee_type_id")]
		public int EmployeeTypeId { get; set; }


		[Column("Employee_type_name")]
		public string? EmployeeTypeName { get; set; }
	}
}
