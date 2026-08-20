namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class UpdateProgressRequestDto
    {
        public int EvaluationId { get; set; }
        public int EmployeeId { get; set; }
        public int AnsweredQuestions { get; set; }
    }
}
