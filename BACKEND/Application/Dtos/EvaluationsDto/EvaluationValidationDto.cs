namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationValidationDto
    {
        public int EvaluationId { get; set; }
        public bool IsServiceApproved { get; set; }
        public bool IsDgApproved { get; set; }
        public DateTime? ServiceApprovalDate { get; set; }
        public DateTime? DgApprovalDate { get; set; }
    }
}
