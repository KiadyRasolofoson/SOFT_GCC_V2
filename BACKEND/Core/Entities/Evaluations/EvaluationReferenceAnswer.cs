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
        public string ReferenceText { get; set; }

        [Column("EvaluationGuidelines")]
        public string EvaluationGuidelines { get; set; }

        [Column("ExpectedKeyPoints")]
        public string ExpectedKeyPoints { get; set; }

        [Column("ScoreDescription1")]
        public string ScoreDescription1 { get; set; }

        [Column("ScoreDescription2")]
        public string ScoreDescription2 { get; set; }

        [Column("ScoreDescription3")]
        public string ScoreDescription3 { get; set; }

        [Column("ScoreDescription4")]
        public string ScoreDescription4 { get; set; }

        [Column("ScoreDescription5")]
        public string ScoreDescription5 { get; set; }

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
        public virtual EvaluationQuestion Question { get; set; }

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; }

        [ForeignKey("UpdatedById")]
        public virtual User UpdatedBy { get; set; }
    }
} 