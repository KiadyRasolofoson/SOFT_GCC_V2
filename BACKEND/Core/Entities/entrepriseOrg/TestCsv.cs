using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.entrepriseOrg
{
	[Table("Test_csv")]
	public class TestCsv
	{
		[Key]
		[Column("test_csv_id")]
		public int TestCsvId { get; set; }

		[Column("nom")]
		public string Nom { get; set; }

		[Column("date_naissance")]
		public DateTime DateNaissance { get; set; }

		[Column("quartier")]
		public string Quartier { get; set; }
	}
}
