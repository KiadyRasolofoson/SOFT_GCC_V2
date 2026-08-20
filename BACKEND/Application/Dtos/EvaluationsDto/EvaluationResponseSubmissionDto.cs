using System;
using System.Collections.Generic;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{   
    public class EvaluationResponseSubmissionDto
    {
        public int QuestionId { get; set; }
        public string ResponseType { get; set; } = string.Empty;
        public string ResponseValue { get; set; } = string.Empty;
        public int TimeSpent { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
} 