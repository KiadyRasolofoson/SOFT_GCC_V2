using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_Reference_Answers")]
    public class EvaluationReferenceAnswer
    {
        [Key]
        [Column("ReferenceAnswerId")]
        public int ReferenceAnswerId { get; set; }

        [Column("QuestionId")]
        public int QuestionId { get; set; }

        [Column("ReferenceText")]
        public string ReferenceText { get; set; } = string.Empty;

        [Column("EvaluationGuidelines")]
        public string EvaluationGuidelines { get; set; } = string.Empty;

        [Column("ExpectedKeyPoints")]
        public string ExpectedKeyPoints { get; set; } = string.Empty;

        [Column("ScoreDescription1")]
        public string ScoreDescription1 { get; set; } = string.Empty;

        [Column("ScoreDescription2")]
        public string ScoreDescription2 { get; set; } = string.Empty;

        [Column("ScoreDescription3")]
        public string ScoreDescription3 { get; set; } = string.Empty;

        [Column("ScoreDescription4")]
        public string ScoreDescription4 { get; set; } = string.Empty;

        [Column("ScoreDescription5")]
        public string ScoreDescription5 { get; set; } = string.Empty;

        [Column("CreatedAt")]
        public DateTime CreatedAt { get; set; }

        [Column("UpdatedAt")]
        public DateTime? UpdatedAt { get; set; }

        [Column("CreatedById")]
        public int? CreatedById { get; set; }

        [Column("UpdatedById")]
        public int? UpdatedById { get; set; }

        [Column("State")]
        public int State { get; set; }

        // Relations avec d'autres entités
        [ForeignKey("QuestionId")]
        public virtual EvaluationQuestion Question { get; set; } = null!;

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; } = null!;

        [ForeignKey("UpdatedById")]
        public virtual User UpdatedBy { get; set; } = null!;
    }
} 