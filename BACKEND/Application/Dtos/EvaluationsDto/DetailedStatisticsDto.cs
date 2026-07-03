using System;
using System.Collections.Generic;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    public class DetailedStatisticsDto
    {
        public ScoreDistributionDto ScoreDistribution { get; set; }
        public List<DistributionItemDto> DepartmentDistribution { get; set; } = new List<DistributionItemDto>();
        public List<DistributionItemDto> EvaluationTypeDistribution { get; set; } = new List<DistributionItemDto>();
        public List<YearlyPerformanceDto> PerformanceByYear { get; set; } = new List<YearlyPerformanceDto>();
        public TrendDto TrendData { get; set; }
    }

    public class ScoreDistributionDto
    {
        public int Low { get; set; }           // Évaluations avec score < 2.5
        public int Medium { get; set; }        // Évaluations avec score entre 2.5 et 4
        public int High { get; set; }          // Évaluations avec score > 4
        public decimal Average { get; set; }   // Score moyen
        public decimal Min { get; set; }       // Score minimum
        public decimal Max { get; set; }       // Score maximum
    }

    public class DistributionItemDto
    {
        public string Label { get; set; }      // Nom du département ou type d'évaluation
        public int Value { get; set; }         // Nombre d'évaluations
        public decimal AverageScore { get; set; }  // Score moyen
    }

    public class YearlyPerformanceDto
    {
        public int Year { get; set; }          // Année
        public decimal AverageScore { get; set; }  // Score moyen pour l'année
        public int Count { get; set; }         // Nombre d'évaluations
        public string BestDepartment { get; set; } // Département avec le meilleur score
    }

    public class TrendDto
    {
        public bool IsIncreasing { get; set; }         // Si la tendance est à la hausse
        public decimal PercentageChange { get; set; }  // Pourcentage de changement entre début et fin
        public decimal StartValue { get; set; }        // Valeur de départ
        public decimal EndValue { get; set; }          // Valeur finale
        public double StandardDeviation { get; set; }  // Écart-type des scores
    }
} 