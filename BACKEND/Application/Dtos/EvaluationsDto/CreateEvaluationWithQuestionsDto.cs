namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{

    public class EmployeeQuestionDto
    {
        public int EmployeeId { get; set; }
        public int EvaluationTypeId { get; set; }
        public int PositionId { get; set; }
        public List<QuestionCompetenceDto> SelectedQuestions { get; set; }
    }

    public class QuestionCompetenceDto
    {
        public int QuestionId { get; set; }
        public int? CompetenceLineId { get; set; }
    }
} 