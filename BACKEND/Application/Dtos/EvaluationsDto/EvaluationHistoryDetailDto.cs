namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationHistoryDetailDto
    {
        public int EvaluationId { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }

        public string? Position { get; set; }
        public string? EvaluationType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? OverallScore { get; set; }
        public string? EvaluationComments { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? Department { get; set; }
        public DateTime? InterviewDate { get; set; }
        public int? InterviewStatus { get; set; }
        public string? Recommendations { get; set; }
        public List<string>? Participants { get; set; } = new List<string>();
        public List<QuestionDetailDto>? QuestionDetails { get; set; }


    }
}
