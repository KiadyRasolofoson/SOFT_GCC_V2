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
        public string TrainingName { get; set; }

        [Column("Description")]
        public string Description { get; set; }

        [MaxLength(50)]
        [Column("Duration")]
        public string Duration { get; set; }

        [MaxLength(100)]
        [Column("Provider")]
        public string Provider { get; set; }

        [MaxLength(50)]
        [Column("Level")]
        public string Level { get; set; }

        [Column("state")]
        public int State { get; set; } = 1;

        // Navigation properties
        public virtual CompetenceLine CompetenceLine { get; set; }
        public virtual ICollection<TrainingSuggestion> TrainingSuggestions { get; set; }
    }
} 