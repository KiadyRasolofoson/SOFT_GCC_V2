namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class StatisticsDto
    {
        public int TotalEvaluations { get; set; }
        public int CompletedEvaluations { get; set; }
        public decimal CompletionRate { get; set; }
        public Dictionary<string, int> EvaluationTypeDistribution { get; set; }
    }
}
