using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("Evaluation_Question_Options")]
    public class EvaluationQuestionOptions
    {
        [Key]
        [Column("OptionId")]
        public int OptionId { get; set; }

        [Column("QuestionId")]
        public int QuestionId { get; set; }
        [Column("OptionText")]
        public string OptionText { get; set; } = string.Empty;
        [Column("IsCorrect")]
        public bool IsCorrect { get; set; }
        [Column("SortOrder")]
        public int SortOrder { get; set; }
        [Column("State")]
        public int State { get; set; }
    }
}
