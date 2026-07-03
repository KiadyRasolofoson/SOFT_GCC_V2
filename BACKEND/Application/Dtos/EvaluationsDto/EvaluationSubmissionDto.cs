using System;
using System.Collections.Generic;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class EvaluationSubmissionDto
    {
        public List<EvaluationResponseSubmissionDto> Responses { get; set; }
        public string OverallFeedback { get; set; }
        public decimal AverageScore { get; set; }
        public DateTime CompletionDate { get; set; } = DateTime.UtcNow;
    }

} 