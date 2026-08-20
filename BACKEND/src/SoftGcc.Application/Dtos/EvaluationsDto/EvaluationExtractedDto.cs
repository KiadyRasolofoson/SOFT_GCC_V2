namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class EvaluationExtractedDto
    {
        public int EmployeeId { get; set; }
        public string EvaluationType { get; set; } = string.Empty;
        public List<QuestionResponseDto> Questions { get; set; } = new List<QuestionResponseDto>();
        public decimal Average { get; set; }
        public string Notes { get; set; } = string.Empty;
    }
    
    public class QuestionResponseDto
    {
        public int? QuestionId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;
        public string CompetenceName { get; set; } = string.Empty;
    }
} 