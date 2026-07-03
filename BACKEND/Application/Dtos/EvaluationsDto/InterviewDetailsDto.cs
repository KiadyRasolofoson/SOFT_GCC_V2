namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class InterviewDetailsDto
    {
        public int InterviewId { get; set; }
        public int EvaluationId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public int Status { get; set; }
        public List<int> ParticipantIds { get; set; } // Liste des IDs des participants
        public string? Notes { get; set; }
        public bool ManagerApproval { get; set; }
        public string? ManagerComments { get; set; }
        public bool DirectorApproval { get; set; }
        public string? DirectorComments { get; set; }
    }
}
