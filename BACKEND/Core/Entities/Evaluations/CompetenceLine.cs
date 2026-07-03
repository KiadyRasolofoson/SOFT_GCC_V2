using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Entities.wish_evolution;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Competence_Lines")]
    public class CompetenceLine
    {
        [Key]
        [Column("CompetenceLineId")]
        public int CompetenceLineId { get; set; }

        [Required]
        [Column("SkillPositionId")]
        public int SkillPositionId { get; set; }

        [Column("Description")]
        public string Description { get; set; }

        [Column("state")]
        public int State { get; set; } = 1;

        [ForeignKey("SkillPositionId")]
        public SkillPosition SkillPosition { get; set; }

        // Navigation properties
        public virtual ICollection<EvaluationQuestion> EvaluationQuestions { get; set; }
        public virtual ICollection<TrainingSuggestion> TrainingSuggestions { get; set; }
        public virtual ICollection<CompetenceTraining> CompetenceTrainings { get; set; }
    }
} 