namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class VEmployeesOngoingEvaluation
    {
        public int? employeeId {  get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Position { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? EvaluationId { get; set; }
        public string? EvaluationTypeId { get; set; }
        public int? EvaluationState { get; set; }
    }
}
