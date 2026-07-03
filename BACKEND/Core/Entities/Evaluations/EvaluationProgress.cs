using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_progress")]
    public class EvaluationProgress
    {
        [Key]
        [Column("Progress_id")]
        public int ProgressId { get; set; }
        [Column("evaluationId")]
        public int evaluationId { get; set; }
       
        [Column("employeeId")]
        public int? employeeId { get; set; }
        [Column("totalQuestions")]
        public int totalQuestions { get; set; }
        [Column("answeredQuestions")]
        public int answeredQuestions { get; set; }
        [Column("progressPercentage")]
        public decimal progressPercentage { get; set; }
        [Column("lastUpdate")]
        public DateTime lastUpdate { get; set; }

        [ForeignKey("evaluationId")]
        public Evaluation evaluation { get; set; }
        
        public Employee employee { get; set; }
    }
}
