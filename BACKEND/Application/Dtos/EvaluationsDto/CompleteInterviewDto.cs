namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class CompleteInterviewDto
    {
        public bool? ManagerApproval { get; set; }
        public string? ManagerComments { get; set; }
        public bool? DirectorApproval { get; set; }
        public string? DirectorComments { get; set; }
        public string? Notes { get; set; }
        public int? Status { get; set; }
    }
}
