namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class ConfigureRemindersDto
    {
        public List<int> EvaluationIds { get; set; } = new();
        public bool IsEnabled { get; set; }
    }
} 