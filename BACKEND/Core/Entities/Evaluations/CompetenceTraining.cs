using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Competence_Trainings")]
    public class CompetenceTraining
    {
        [Key]
        [Column("TrainingId")]
        public int TrainingId { get; set; }

        [Required]
        [Column("CompetenceLineId")]
        public int CompetenceLineId { get; set; }

        [Required]
        [MaxLength(255)]
        [Column("TrainingName")]
        public string TrainingName { get; set; } = string.Empty;

        [Column("Description")]
        public string Description { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("Duration")]
        public string Duration { get; set; } = string.Empty;

        [MaxLength(100)]
        [Column("Provider")]
        public string Provider { get; set; } = string.Empty;

        [MaxLength(50)]
        [Column("Level")]
        public string Level { get; set; } = string.Empty;

        [Column("state")]
        public int State { get; set; } = 1;

        // Navigation properties
        public virtual CompetenceLine CompetenceLine { get; set; } = null!;
        public virtual ICollection<TrainingSuggestion> TrainingSuggestions { get; set; } = new List<TrainingSuggestion>();
    }
} 