using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.crud_career
{
	[Table("Payment_method")]
	public class PaymentMethod
	{
		[Key]
		[Column("Payment_method_id")]
		public int PaymentMethodId { get; set; }


		[Column("Payment_method_name")]
		public string? PaymentMethodName { get; set; }
	}
}
