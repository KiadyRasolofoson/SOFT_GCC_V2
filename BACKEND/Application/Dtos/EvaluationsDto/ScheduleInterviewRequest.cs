namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class ScheduleInterviewRequest
    {
        public int EvaluationId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public List<int> Participants { get; set; }
        public int? EmployeeId { get; set; }
        public bool SendEmails { get; set; } = true; // Par défaut, on envoie des emails
    }
}
