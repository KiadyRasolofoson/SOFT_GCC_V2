namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class CreateEvaluationDto
    {
        public int UserId { get; set; }
        public int EmployeeId { get; set; }
        public int EvaluationTypeId { get; set; }
        public List<int> SupervisorIds { get; set; } = new List<int>();
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int state { get; set; }
        public bool EnableReminders { get; set; } = false;
    }
}
