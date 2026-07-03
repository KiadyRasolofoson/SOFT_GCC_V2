using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
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

        public string ActionPlan { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("EvaluationId")]
        public Evaluation Evaluation { get; set; }
    }
}
