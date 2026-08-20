using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    /// <summary>
    /// Journalise chaque transition de statut d'une évaluation pour l'historique du workflow.
    /// </summary>
    [Table("EvaluationStatusLogs")]
    public class EvaluationStatusLog
    {
        [Key]
        [Column("status_log_id")]
        public int StatusLogId { get; set; }

        [Column("evaluation_id")]
        public int EvaluationId { get; set; }

        [Column("old_state")]
        public int? OldState { get; set; }

        [Column("new_state")]
        public int NewState { get; set; }

        [Column("changed_by_user_id")]
        public int ChangedByUserId { get; set; }

        [Column("changed_at")]
        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        [Column("comment")]
        [MaxLength(500)]
        public string? Comment { get; set; }

        [ForeignKey("EvaluationId")]
        public Evaluation? Evaluation { get; set; }

        [ForeignKey("ChangedByUserId")]
        public User? ChangedByUser { get; set; }
    }
}
