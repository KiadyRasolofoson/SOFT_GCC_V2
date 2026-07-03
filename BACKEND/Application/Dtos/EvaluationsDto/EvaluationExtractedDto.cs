namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationExtractedDto
    {
        public int EmployeeId { get; set; }
        public string EvaluationType { get; set; }
        public List<QuestionResponseDto> Questions { get; set; } = new List<QuestionResponseDto>();
        public decimal Average { get; set; }
        public string Notes { get; set; }
    }
    
    public class QuestionResponseDto
    {
        public int? QuestionId { get; set; }
        public string QuestionText { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public string CompetenceName { get; set; }
    }
} 