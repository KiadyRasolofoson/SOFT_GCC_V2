using System;
using System.Collections.Generic;

namespace SoftGcc.Application.Dtos.EvaluationsDto
{
    public class DurationRecommendationDto
    {
        public int Days { get; set; }
        public int Weeks { get; set; }
        public int RemainingDays { get; set; }
        public string WeeksDisplay { get; set; } = string.Empty;
        public string Justification { get; set; } = string.Empty;
        public bool IsCurrentDurationSufficient { get; set; }
        public List<string> FactorsConsidered { get; set; } = new List<string>();
    }

    public class CalculateDurationRequestDto
    {
        public int EmployeeCount { get; set; }
        public int EvaluationTypeId { get; set; }
        public List<int> PositionIds { get; set; } = new List<int>();
        public int? CurrentDurationDays { get; set; }
        public int? AverageQuestionsPerEmployee { get; set; }
        public int? TotalCompetences { get; set; }
        public int SupervisorCount { get; set; } = 1; // Nombre de superviseurs, par défaut 1
    }
} 