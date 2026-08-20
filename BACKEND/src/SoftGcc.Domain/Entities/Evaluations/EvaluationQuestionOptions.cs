using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
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
        public string OptionText { get; set; } = string.Empty;
        [Column("isCorrect")]
        public bool IsCorrect { get; set; }
        [Column("state")]
        public int State { get; set; }
    }
}
