using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.wish_evolution
{
	[Table("Wish_evolution_career")]
	public class WishEvolutionCareer
	{
		[Key]
		[Column("Wish_evolution_career_id")]
		public int WishEvolutionCareerId { get; set; }

		[Column("Position_id")]
		public int? PositionId { get; set; }

		[Column("Employee_id")]
		public int? EmployeeId { get; set; }

		[Column("Wish_type_id")]
		public int? WishTypeId { get; set; }

		[Column("Motivation")]
		public string? Motivation { get; set; }

		[Column("Disponibility")]
		public DateTime? Disponibility { get; set; }

		[Column("Priority")]
		public double? Priority { get; set; }

		[Column("Request_date")]
		public DateTime? RequestDate { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
