using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.salary_skills.p_sw
{
    /// <summary>
    /// Miroir dbo.T_HST_AFFECTATION (p_sw) — lecture seule.
    /// InfoEnCours = 1 ⇒ affectation actuellement en vigueur.
    /// </summary>
    [Table("T_HST_AFFECTATION", Schema = "dbo")]
    public class THstAffectation
    {
        [Key]
        [Column("IdHstAffectation")]
        public int IdHstAffectation { get; set; }

        [Column("NumSalarie")]
        public int NumSalarie { get; set; }

        [Column("Departement")]
        [MaxLength(10)]
        public string? Departement { get; set; }

        [Column("Service")]
        [MaxLength(10)]
        public string? Service { get; set; }

        [Column("EmploiOccupe")]
        [MaxLength(60)]
        public string? EmploiOccupe { get; set; }

        [Column("DateDebut")]
        public DateTime? DateDebut { get; set; }

        [Column("DateEntreePoste")]
        public DateTime? DateEntreePoste { get; set; }

        [Column("InfoEnCours")]
        public byte? InfoEnCours { get; set; }
    }
}
