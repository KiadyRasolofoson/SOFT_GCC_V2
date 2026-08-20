namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class QuestionDetailDto
    {
        public int QuestionId { get; set; }
        public string Question { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }
}
