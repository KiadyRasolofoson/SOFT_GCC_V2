using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("EvaluationQuestionConfig")]
    public class EvaluationQuestionConfig
    {
        [Key]
        public int Id { get; set; }
        
        public int QuestionId { get; set; }
        
        public int MaxTimeInMinutes { get; set; } = 15;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        [ForeignKey("QuestionId")]
        public virtual EvaluationQuestion Question { get; set; }
    }
}
