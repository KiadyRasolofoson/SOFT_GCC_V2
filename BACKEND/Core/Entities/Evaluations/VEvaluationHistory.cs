namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class VEvaluationHistory
    {
        public int EvaluationId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }

        public string? Position { get; set; }
        public string? EvaluationType { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? OverallScore { get; set; }
        public int status { get; set; }
        public string? EvaluationComments { get; set; }
        public string? Strengths { get; set; }
        public string? Weaknesses { get; set; }
        public string? Department { get; set; }
        public DateTime? InterviewDate { get; set; }
        public int? InterviewStatus { get; set; }
        public string? Recommendations { get; set; }
        public string? ParticipantNames {  get; set; }
        public string? QuestionDetails { get; set; } // Nouveau champ


    }
}
