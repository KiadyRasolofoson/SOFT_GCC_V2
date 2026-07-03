using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("ImageEntity")]
	public class ImageEntity
	{
		[Key]
		[Column("id")]
		public int Id { get; set; }

		[Column("file_name")]
		public string FileName { get; set; }

		[Column("content_type")]
		public string ContentType { get; set; }

		[Column("size")]
		public long Size { get; set; }

		[Column("image_data")]
		public byte[] ImageData { get; set; } // Stocker l'image en base
	}
}
