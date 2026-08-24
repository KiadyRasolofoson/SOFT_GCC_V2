namespace SoftGcc.Domain.Entities.Evaluations
{
    public class KPIResult
    {
        public double ParticipationRate { get; set; } // Taux de participation
        public double ApprovalRate { get; set; }     // Taux de validation
        public decimal? OverallAverage { get; set; }   // Moyenne générale des scores
        public int TotalEvaluations { get; set; }    // Nombre total d'évaluations
    }
}
