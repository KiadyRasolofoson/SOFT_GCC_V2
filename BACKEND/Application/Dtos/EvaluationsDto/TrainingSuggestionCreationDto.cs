namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class TrainingSuggestionCreationDto
    {
        public int EvaluationTypeId { get; set; } // Optionnel si lié à un type d'évaluation
        public int QuestionId { get; set; } // Optionnel si lié à une question
        public string Training { get; set; }
        public string Details { get; set; }
        public int ScoreThreshold { get; set; }
        public int State { get; set; }
    }
}
