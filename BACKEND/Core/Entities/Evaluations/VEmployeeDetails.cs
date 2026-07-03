namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class VEmployeeDetails
    {
        public int EmployeeId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Position { get; set; }
        public string Department { get; set; }
        public int? EvaluationId { get; set; }
        public DateTime? EvaluationDate { get; set; }
        public decimal? OverallScore { get; set; }
        public string? EvaluationComments { get; set; }
        public string? weaknesses {  get; set; }
        public string? strengths {  get; set; }
        public bool? IsServiceApproved { get; set; }
        public bool? IsDgApproved { get; set; }
        public string? EvaluationType { get; set; }
        public int? positionId {  get; set; }

        public int? state {  get; set; }
    }
}
