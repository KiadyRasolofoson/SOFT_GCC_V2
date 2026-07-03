using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Performance_evolution")]
    public class PerformanceEvolution
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [Column(TypeName = "date")]
        public DateTime Period { get; set; }

        public int EvaluationQuestionnaireId { get; set; }

        [Column(TypeName = "decimal(5, 2)")]
        public decimal Score { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("EvaluationQuestionnaireId")]
        public EvaluationQuestionnaire EvaluationQuestionnaire { get; set; }
    }
}
