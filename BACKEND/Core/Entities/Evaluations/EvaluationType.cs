using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_type")]
    public class EvaluationType
    {
        [Key]
        [Column("Evaluation_type_id")]
        public int EvaluationTypeId { get; set; }

        [MaxLength(100)]
        public string Designation { get; set; }
        [Column("state")]
        public int? state { get; set; }
    }
}
