using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("Evaluation_Responses")]
    public class EvaluationResponses
    {
        [Key]
        [Column("ResponseId")]
        public int ResponseId { get; set; }
        [Column("EvaluationId")]
        public int EvaluationId { get; set; }
        [Column("QuestionId")]
        public int QuestionId { get; set; }
        [Column("ResponseType")]
        public string ResponseType { get; set; } = string.Empty;
        [Column("ResponseValue")]
        public string ResponseValue { get; set; } = string.Empty;
        [Column("TimeSpent")]
        public int TimeSpent { get; set; }
        [Column("StartTime")]
        public DateTime StartTime { get; set; }
        [Column("EndTime")]
        public DateTime EndTime { get; set; }
        [Column("IsCorrect")]
        public bool IsCorrect { get; set; }
        [Column("State")]
        public int State { get; set; }
        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("EvaluationId")]
        public Evaluation Evaluation { get; set; } = null!;
        [ForeignKey("QuestionId")]
        public EvaluationQuestion Question { get; set; } = null!;
        
    }
}
