namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class UpdateInterviewDto
    {
        public DateTime? NewDate { get; set; }
        public List<int>? NewParticipantIds { get; set; } // Mise à jour des participants
        public int? NewStatus { get; set; } // Statut : Scheduled, In Progress, etc.
    }
}
