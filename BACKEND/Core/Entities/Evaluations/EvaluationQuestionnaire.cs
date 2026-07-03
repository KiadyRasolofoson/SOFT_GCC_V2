using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_questionnaire")]
    public class EvaluationQuestionnaire
    {
        [Key]
        [Column("evaluation_questionnaire_id")]
        public int EvaluationQuestionnaireId { get; set; }

        [Column("evaluationId")]
        public int EvaluationId { get; set; }      

        [Column(TypeName = "decimal(5, 2)")]
        public decimal Score { get; set; }

        [Column("questionId")]
        public int questionId {  get; set; }

        public string? Comments { get; set; }
        [Column("state")]
        public int state {  get; set; }

        [ForeignKey("EvaluationId")]
        public Evaluation Evaluation { get; set; }

        [ForeignKey("questionId")]
        public EvaluationQuestion evaluationQuestion { get; set; }


    }
}
