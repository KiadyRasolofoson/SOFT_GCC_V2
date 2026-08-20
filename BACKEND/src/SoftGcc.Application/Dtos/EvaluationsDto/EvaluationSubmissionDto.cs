using System;
using System.Collections.Generic;

namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class EvaluationSubmissionDto
    {
        public List<EvaluationResponseSubmissionDto> Responses { get; set; } = new();
        public string OverallFeedback { get; set; } = string.Empty;
        public decimal AverageScore { get; set; }
        public DateTime CompletionDate { get; set; } = DateTime.UtcNow;
    }

} 