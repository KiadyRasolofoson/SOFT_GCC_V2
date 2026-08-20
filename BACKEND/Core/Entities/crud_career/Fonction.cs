using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.crud_career
{
	[Table("Fonction")]
	public class Fonction
	{
		[Key]
		[Column("Fonction_id")]
		public int FonctionId { get; set; }


		[Column("Fonction_name")]
		public string? FonctionName { get; set; }

	}
}
