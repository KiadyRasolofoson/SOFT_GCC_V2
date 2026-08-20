using soft_carriere_competence.Core.Entities.crud_career;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_questions")]
    public class EvaluationQuestion
    {
        [Key]
        [Column("Question_id")]
        public int questionId { get; set; }
        [Column("evaluationTypeId")]
        public int evaluationTypeId { get; set; }
        [Column("positionId")]
        public int positionId { get; set; }
        [Column("CompetenceLineId")]
        public int? CompetenceLineId { get; set; }
        [Column("question")]
        public string question { get; set; } = string.Empty;
        [Column("ResponseTypeId")]
        public int ResponseTypeId { get; set; } = 1; // Par défaut, type TEXT
        [Column("state")]
        public int state { get; set; }
        
        [ForeignKey("evaluationTypeId")]
        public EvaluationType EvaluationType { get; set; } = null!;
        [ForeignKey("positionId")]
        public Position Position { get; set; } = null!;
        [ForeignKey("CompetenceLineId")]
        public CompetenceLine CompetenceLine { get; set; } = null!;
        [ForeignKey("ResponseTypeId")]
        public ResponseType ResponseType { get; set; } = null!;
    }
}
