using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Assignment_type")]
	public class AssignmentType
	{
		[Key]
		[Column("Assignment_type_id")]
		public int AssignmentTypeId { get; set; }


		[Column("Assignment_type_name")]
		public string? AssignmentTypeName { get; set; }
	}
}
