using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills.p_sw
{
    /// <summary>
    /// Miroir dbo.T_HST_POSTE (p_sw) — lecture seule.
    /// InfoEnCours = 1 ⇒ poste actuellement en vigueur.
    /// </summary>
    [Table("T_HST_POSTE", Schema = "dbo")]
    public class THstPoste
    {
        [Key]
        [Column("IdHstPoste")]
        public int IdHstPoste { get; set; }

        [Column("NumSalarie")]
        public int NumSalarie { get; set; }

        [Column("CodePoste")]
        [MaxLength(10)]
        public string? CodePoste { get; set; }

        [Column("EmploiType")]
        [MaxLength(80)]
        public string? EmploiType { get; set; }

        [Column("MatriculeSuperieurHie")]
        [MaxLength(10)]
        public string? MatriculeSuperieurHie { get; set; }

        [Column("DateDebut")]
        public DateTime? DateDebut { get; set; }

        [Column("InfoEnCours")]
        public byte? InfoEnCours { get; set; }
    }
}
