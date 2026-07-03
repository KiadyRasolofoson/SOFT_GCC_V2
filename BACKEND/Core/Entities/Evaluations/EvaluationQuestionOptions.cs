using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("evaluation_question_options")]
    public class EvaluationQuestionOptions
    {
        [Key]
        [Column("optionId")]
        public int OptionId { get; set; }

        [Column("questionId")]
        public int QuestionId { get; set; }
        [Column("optionText")]
        public string OptionText { get; set; }
        [Column("isCorrect")]
        public bool IsCorrect { get; set; }
        [Column("state")]
        public int State { get; set; }
    }
}
