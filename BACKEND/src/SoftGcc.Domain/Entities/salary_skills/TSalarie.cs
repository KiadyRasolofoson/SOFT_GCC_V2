using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.salary_skills
{
    /// <summary>
    /// Entité miroir de la table dbo.T_SAL dans la base p_sw (paie).
    /// Lecture seule — utilisée uniquement pour la synchronisation employé.
    /// </summary>
    [Table("T_SAL", Schema = "dbo")]
    public class TSalarie
    {
        [Key]
        [Column("SA_CompteurNumero")]
        public int SaCompteurNumero { get; set; }

        [Column("MatriculeSalarie")]
        public string MatriculeSalarie { get; set; } = string.Empty;

        [Column("Civilite")]
        public byte? Civilite { get; set; }

        [Column("Nom")]
        public string? Nom { get; set; }

        [Column("Prenom")]
        public string? Prenom { get; set; }

        [Column("DateNaissance")]
        public DateTime? DateNaissance { get; set; }

        [Column("EMail")]
        public string? EMail { get; set; }
    }
}
