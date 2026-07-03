using System.Collections.Generic;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class SelectedQuestion
    {
        public int QuestionId { get; set; }
        public int? CompetenceLineId { get; set; }
    }

    public class SelectedQuestionsDto
    {
        public int UserId { get; set; }
        public int EmployeeId { get; set; }
        public int EvaluationTypeId { get; set; }
        public int PositionId { get; set; }
        public List<SelectedQuestion> SelectedQuestions { get; set; }
    }

    public class CreateEvaluationWithQuestionsDto
    {
        public int EvaluationTypeId { get; set; }
        public List<int> SupervisorIds { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<SelectedQuestionsDto> EmployeeQuestions { get; set; }
        public bool EnableReminders { get; set; } = false;
    }
} 