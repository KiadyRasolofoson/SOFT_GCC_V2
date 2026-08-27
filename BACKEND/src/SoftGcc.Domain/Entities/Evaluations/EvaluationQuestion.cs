using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SoftGcc.Domain.Entities.Evaluations
{
    [Table("Evaluation_questions")]
    public class EvaluationQuestion
    {
        [Key]
        [Column("Question_id")]
        public int questionId { get; set; }
        [Column("evaluationTypeId")]
        public int evaluationTypeId { get; set; }

        /// <summary>
        /// Compétence évaluée par la question (référentiel). Le domaine et la famille en
        /// découlent via <c>Skill.Family_id</c> → <c>Skill_family.Domain_skill_id</c>.
        /// Nullable en base pour les questions historiques non encore rattachées.
        /// </summary>
        [Column("SkillId")]
        public int? SkillId { get; set; }

        /// <summary>Poste facultatif : restreint la question à un poste, sinon « tous les postes ».</summary>
        [Column("positionId")]
        public int? positionId { get; set; }
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
        [ForeignKey("SkillId")]
        public Skill? Skill { get; set; }
        [ForeignKey("positionId")]
        public Position? Position { get; set; }
        [ForeignKey("CompetenceLineId")]
        public CompetenceLine? CompetenceLine { get; set; }
        [ForeignKey("ResponseTypeId")]
        public ResponseType ResponseType { get; set; } = null!;
    }
}
