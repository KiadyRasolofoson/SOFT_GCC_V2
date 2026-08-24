namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class TrainingSuggestionsRequestDto
    {
        public required Dictionary<int, int> Ratings { get; set; } // QuestionId -> Score
    }
}
