namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class ScheduleInterviewDto
    {
        public int EvaluationId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public List<int> ParticipantIds { get; set; } = new();
    }
}
