using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.career_plan
{
	[Table("Certificate_history")]
	public class CertificateHistory
	{
		[Key]
		[Column("Certificate_history_id")]
		public int CertificateHistoryId { get; set; }

		[Column("Registration_number")]
		public string? RegistrationNumber { get; set; }

		[Column("Certificate_type_id")]
		public int? CertificateTypeId { get; set; }

		[Column("reference")]
		public string? Reference { get; set; }

		[Column("Pdf_file")]
		public byte[]? PdfFile { get; set; }

		[Column("File_name")]
		public string? FileName { get; set; }

		[Column("Content_type")]
		public string? ContentType { get; set; }

		[Column("State")]
		public int? State { get; set; }

		[Column("Creation_date")]
		public DateTime? CreationDate { get; set; }

		[Column("Updated_date")]
		public DateTime? UpdatedDate { get; set; }

		
	}
}
