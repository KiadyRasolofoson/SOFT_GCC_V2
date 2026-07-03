using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Establishment")]
	public class Establishment
	{
		[Key]
		[Column("Establishment_id")]
		public int EstablishmentId { get; set; }


		[Column("Establishment_name")]
		public string? EstablishmentName { get; set; }

        [Column("Adress")]
        public string? Address { get; set; }

        [Column("Contact")]
        public string? PhoneNumber { get; set; }

        [Column("Mail")]
        public string? Email { get; set; }

        [Column("Website")]
        public string? Website { get; set; }

        [Column("Social_network")]
        public string? SocialMedia { get; set; }

        [Column("Logo")]
        public byte[]? Logo { get; set; }

        [Column("Creation_date")]
        public DateTime? CreationDate { get; set; }

        [Column("Updated_date")]
        public DateTime? UpdatedDate { get; set; }
    }
}
