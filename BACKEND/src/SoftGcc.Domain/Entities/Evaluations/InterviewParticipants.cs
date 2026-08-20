using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Domain.Entities.Evaluations
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
        public EvaluationInterviews Interview { get; set; } = null!;
        
        [ForeignKey("UserId")]
        public User User { get; set; } = null!;

        [ForeignKey("EmployeeId")]
        public Employee Employee { get; set; } = null!;
    }
}
