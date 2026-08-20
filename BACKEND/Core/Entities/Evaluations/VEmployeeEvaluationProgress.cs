namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class VEmployeeEvaluationProgress
    {
        public int evaluationId {  get; set; }
        public int employeeId { get; set; }
        public string? firstName { get; set; }
        public string? lastName { get; set; }
        public int? totalQuestions {  get; set; }
        public int? answeredQuestions { get; set; }
        public decimal? progress { get; set; }
        public DateTime? LastUpdated { get; set; }
    }
}
