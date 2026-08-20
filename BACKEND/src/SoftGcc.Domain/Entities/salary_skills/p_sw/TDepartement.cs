using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills.p_sw
{
    /// <summary>
    /// Miroir dbo.T_DEPARTEMENT (p_sw) — lecture seule.
    /// </summary>
    [Table("T_DEPARTEMENT", Schema = "dbo")]
    public class TDepartement
    {
        [Key]
        [Column("Code")]
        [MaxLength(10)]
        public string Code { get; set; } = string.Empty;

        [Column("Intitule")]
        [MaxLength(80)]
        public string? Intitule { get; set; }
    }
}
