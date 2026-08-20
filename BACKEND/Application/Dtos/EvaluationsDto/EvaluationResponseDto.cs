namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationResponseDto
    {
        public int EvaluationId { get; set; }
        public int QuestionId { get; set; }
        public string ResponseType { get; set; } = string.Empty;  // 'QCM', 'TEXT', 'SCORE'
        public string ResponseValue { get; set; } = string.Empty;
        public int TimeSpent { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsCorrect { get; set; }
    }
}
