using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("EvaluationSupervisors")]
    public class EvaluationSupervisors
    {
        [Key]
        [Column("EvaluationId", Order = 0)]
        public int EvaluationId { get; set; }

        [Key]
        [Column("SupervisorId", Order = 1)]
        public int SupervisorId { get; set; }

        [ForeignKey("EvaluationId")]
        public virtual Evaluation Evaluation { get; set; }

        [ForeignKey("SupervisorId")]
        public virtual User Supervisor { get; set; }
    }
}
