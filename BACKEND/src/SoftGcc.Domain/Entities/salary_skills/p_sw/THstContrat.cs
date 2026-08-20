using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills.p_sw
{
    /// <summary>
    /// Miroir dbo.T_HST_CONTRAT (p_sw) — lecture seule.
    /// InfoEnCours = 1 ⇒ contrat actuellement en vigueur.
    /// </summary>
    [Table("T_HST_CONTRAT", Schema = "dbo")]
    public class THstContrat
    {
        [Key]
        [Column("IdHstContrat")]
        public int IdHstContrat { get; set; }

        [Column("NumSalarie")]
        public int NumSalarie { get; set; }

        [Column("DateDebutContrat")]
        public DateTime? DateDebutContrat { get; set; }

        [Column("DateFinContrat")]
        public DateTime? DateFinContrat { get; set; }

        [Column("CodeNatureDeContrat")]
        [MaxLength(10)]
        public string? CodeNatureDeContrat { get; set; }

        [Column("InfoEnCours")]
        public byte? InfoEnCours { get; set; }
    }
}
