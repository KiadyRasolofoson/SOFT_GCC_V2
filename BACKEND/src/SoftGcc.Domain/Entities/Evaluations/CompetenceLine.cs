using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Entities.wish_evolution;

namespace SoftGcc.Domain.Entities.Evaluations
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
        public string Description { get; set; } = string.Empty;

        [Column("state")]
        public int State { get; set; } = 1;

        [ForeignKey("SkillPositionId")]
        public SkillPosition SkillPosition { get; set; } = null!;

        // Navigation properties
        public virtual ICollection<EvaluationQuestion> EvaluationQuestions { get; set; } = new List<EvaluationQuestion>();
        public virtual ICollection<TrainingSuggestion> TrainingSuggestions { get; set; } = new List<TrainingSuggestion>();
        public virtual ICollection<CompetenceTraining> CompetenceTrainings { get; set; } = new List<CompetenceTraining>();
    }
} 