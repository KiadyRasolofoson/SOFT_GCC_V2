using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("Evaluation_history")]
    public class EvaluationHistory
    {
        [Key]
        public int EvaluationHistoryId { get; set; }

        public int UserId { get; set; }

        public int EvaluationId { get; set; }

        [Column(TypeName = "date")]
        public DateTime EvaluationDate { get; set; }

        [Column(TypeName = "decimal(5, 2)")]
        public decimal OverallScore { get; set; }

        public string ActionPlan { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("EvaluationId")]
        public Evaluation Evaluation { get; set; } = null!;
    }
}
