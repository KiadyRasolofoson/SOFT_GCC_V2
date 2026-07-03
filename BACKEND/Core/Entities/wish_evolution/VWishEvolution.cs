using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.wish_evolution
{
	public class VWishEvolution
	{
		[Column("Wish_evolution_career_id")]
		public int? WishEvolutionCareerId { get; set; }

		[Column("Employee_id")]
		public int? EmployeeId { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("Name")]
		public string? Name { get; set; }

		[Column("FirstName")]
		public string? FirstName { get; set; }

		[Column("Hiring_date")]
		public DateTime? HiringDate { get; set; }

		[Column("Birthday")]
		public DateTime? Birthday { get; set; }

		[Column("Wish_position_id")]
		public int? WishPositionId { get; set; }

		[Column("Wish_position_name")]
		public string? WishPositionName { get; set; }

		[Column("Wish_type_id")]
		public int? WishTypeId { get; set; }

		[Column("Wish_type_name")]
		public string? WishTypeName { get; set; }

		[Column("Motivation")]
		public string? Motivation { get; set; }

		[Column("Disponibility")]
		public DateTime? Disponibility { get; set; }

		[Column("Priority")]
		public double? Priority { get; set; }

		[Column("Priority_letter")]
		public string? PriorityLetter { get; set; }

		[Column("Request_date")]
		public DateTime? RequestDate { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("State_letter")]
		public string? StateLetter { get; set; }

		[Column("Actual_department_id")]
		public int? ActualDepartmentId { get; set; }

		[Column("Actual_department_name")]
		public string? ActualDepartmentName { get; set; }

		[Column("Actual_position_id")]
		public int? ActualPositionId { get; set; }

		[Column("Actual_position_name")]
		public string? ActualPositionName { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }
	}
}
