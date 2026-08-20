namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class EvaluationHistoryDto
    {
        public int EvaluationId { get; set; }
        public string LastName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;

        public string? Position { get; set; }
        public string? EvaluationType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? OverallScore { get; set; }
        public int? Status { get; set; }
        public string? Recommendations { get; set; } // Ajout de cette propriété

    }
}
