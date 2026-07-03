using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class InterviewParticipants
    {
        [Key]
        public int ParticipantId { get; set; }

        [Column("InterviewId")]
        public int InterviewId { get; set; }

        [Column("UserId")]
        public int? UserId { get; set; } 

        [Column("EmployeeId")]
        public int? EmployeeId { get; set; }

        [ForeignKey("InterviewId")]
        public EvaluationInterviews Interview { get; set; }
        
        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; }
    }
}
