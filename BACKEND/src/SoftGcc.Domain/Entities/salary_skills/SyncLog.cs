using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.salary_skills
{
    /// <summary>
    /// Journal des synchronisations T_SAL (p_sw) → Employee (Soft_GCC).
    /// </summary>
    [Table("SyncLog")]
    public class SyncLog
    {
        [Key]
        [Column("SyncLog_id")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SyncLogId { get; set; }

        [Column("SyncDate")]
        public DateTime SyncDate { get; set; }

        [Column("RecordsUpdated")]
        public int RecordsUpdated { get; set; }

        [Column("RecordsInserted")]
        public int RecordsInserted { get; set; }

        [Column("RecordsFailed")]
        public int RecordsFailed { get; set; }

        [Column("Status")]
        [MaxLength(20)]
        public string Status { get; set; } = "Success"; // Success, Partial, Failed

        [Column("ErrorMessage")]
        public string? ErrorMessage { get; set; }
    }
}
