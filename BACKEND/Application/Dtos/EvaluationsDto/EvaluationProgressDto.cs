namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationProgressDto
    {
        public int EmployeeId { get; set; }
        public int TotalQuestions { get; set; }
        public int AnsweredQuestions { get; set; }
        public decimal ProgressPercentage { get; set; }
    }
} 