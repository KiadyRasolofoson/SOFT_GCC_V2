using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills.p_sw
{
    /// <summary>
    /// Miroir dbo.T_HST_ETABLISSEMENT (p_sw) — lecture seule.
    /// InfoEnCours = 1 ⇒ établissement actuellement en vigueur.
    /// </summary>
    [Table("T_HST_ETABLISSEMENT", Schema = "dbo")]
    public class THstEtablissement
    {
        [Key]
        [Column("IdHstEtab")]
        public int IdHstEtab { get; set; }

        [Column("NumSalarie")]
        public int NumSalarie { get; set; }

        [Column("CodeEtab")]
        [MaxLength(10)]
        public string? CodeEtab { get; set; }

        [Column("EnseigneDuLieuDeTravail")]
        [MaxLength(80)]
        public string? EnseigneDuLieuDeTravail { get; set; }

        [Column("DateEntree")]
        public DateTime? DateEntree { get; set; }

        [Column("DateSortie")]
        public DateTime? DateSortie { get; set; }

        [Column("DateDebut")]
        public DateTime? DateDebut { get; set; }

        [Column("InfoEnCours")]
        public byte? InfoEnCours { get; set; }
    }
}
