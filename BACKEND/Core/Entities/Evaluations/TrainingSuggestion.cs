using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Training_suggestions")]
    public class TrainingSuggestion
    {
        [Key]
        [Column("Training_suggestion_id")]
        public int TrainingSuggestionId { get; set; }
        [Column("evaluationTypeId")]
        public int evaluationTypeId { get; set; }
        [Column("questionId")]
        public int questionId {  get; set; }
        [Column("CompetenceLineId")]
        public int? CompetenceLineId { get; set; }
        [MaxLength(255)]
        [Column("training")]
        public string Training { get; set; }
        [Column("details")]
        public string Details { get; set; }
        [Column("state")]
        public int state {  get; set; }
        [Column("TrainingId")]
        public int? TrainingId { get; set; }
       
        [Column("scoreThreshold")]
        public int scoreThreshold {  get; set; }
        [ForeignKey("evaluationTypeId")]
        public EvaluationType evaluationType { get; set; }
        [ForeignKey("questionId")]
        public EvaluationQuestion evaluationQuestion {  get; set; }
        [ForeignKey("CompetenceLineId")]
        public CompetenceLine competenceLine { get; set; }
        [ForeignKey("TrainingId")]
        public CompetenceTraining competenceTraining { get; set; }
    }
}
