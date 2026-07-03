using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_Selected_Questions")]
    public class EvaluationSelectedQuestions
    {
        [Column("SelectedQuestionId")]
        [Key]
        public int SelectedQuestionId { get; set; }
        [Column("EvaluationId")]
        public int EvaluationId { get; set; }
        [Column("QuestionId")]
        public int QuestionId { get; set; }
        [Column("CompetenceLineId")]
        public int CompetenceLineId { get; set; }

        
        [ForeignKey("EvaluationId")]
        public Evaluation SelectedEvaluation { get; set; }
        [ForeignKey("QuestionId")]
        public EvaluationQuestion SelectedQuestion { get; set; }
        [ForeignKey("CompetenceLineId")]
        public CompetenceLine SelectedCompetenceLine { get; set; }
    }
}
