using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
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
        public string ResponseType { get; set; }
        [Column("ResponseValue")]
        public string ResponseValue { get; set; }
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
        public DateTime CreatedAt { get; set; }

        [ForeignKey("EvaluationId")]
        public Evaluation Evaluation { get; set; }
        [ForeignKey("QuestionId")]
        public EvaluationQuestion Question { get; set; }
        
    }
}
