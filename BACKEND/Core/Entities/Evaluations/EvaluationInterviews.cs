using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    [Table("Evaluation_interviews")]
    public class EvaluationInterviews
    {
        [Key]
        [Column("InterviewId")]
        public int InterviewId { get; set; }

        [Column("evaluationId")]
        public int EvaluationId { get; set; }

        [Column("scheduled_date")]
        public DateTime InterviewDate { get; set; }

        [Column("status", TypeName = "int")]
        public InterviewStatus status { get; set; }

        [Column("notes")]
        public string? notes { get; set; }

        [Column("manager_approval")]
        public bool? managerApproval { get; set; }

        [Column("manager_comments")]
        public string? managerComments { get; set; }

        [Column("director_approval")]
        public bool? directorApproval { get; set; }

        [Column("director_comments")]
        public string? directorComments { get; set; }


    }
}
