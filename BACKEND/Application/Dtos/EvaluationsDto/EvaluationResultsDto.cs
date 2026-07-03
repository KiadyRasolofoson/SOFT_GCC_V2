using System.Text.Json.Serialization;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    /// DTO pour l'envoi des résultats d'évaluation
    public class EvaluationResultsDto
    {
        /// ID de l'évaluation
        public int EvaluationId { get; set; }

        /// Notation simple par question (ID de question -> note)
        /// Pour maintenir la compatibilité avec l'ancien système
        public Dictionary<int, int> Ratings { get; set; } = new Dictionary<int, int>();

        /// Notations multicritères détaillées par question (optionnel)
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public List<MultiCriteriaRatingDto>? DetailedRatings { get; set; }

        /// Score global de l'évaluation
        public decimal OverallScore { get; set; }

        /// Points forts identifiés
        public string? Strengths { get; set; }

        /// Points à améliorer identifiés
        public string? Weaknesses { get; set; }

        /// Évaluation générale / remarques globales
        public string? GeneralEvaluation { get; set; }

        /// Méthode utilitaire pour extraire les notes détaillées
        /// <returns>Liste des notes détaillées ou null si non disponible</returns>
        public List<MultiCriteriaRatingDto>? GetDetailedRatings()
        {
            return DetailedRatings;
        }

        /// Vérifie si des notations détaillées sont disponibles
        /// <returns>true si des notations détaillées sont présentes</returns>
        public bool HasDetailedRatings()
        {
            return DetailedRatings != null && DetailedRatings.Count > 0;
        }

        /// Synchronise les notes simples et détaillées pour assurer la cohérence
        public void SynchronizeRatings()
        {
            if (!HasDetailedRatings())
                return;

            foreach (var detailedRating in DetailedRatings)
            {
                if (detailedRating.QuestionId <= 0)
                    continue;

                // Calculer la note globale à partir des critères
                detailedRating.OverallRating = detailedRating.CalculateOverallRating();

                // Synchroniser avec le dictionnaire des notes simples
                Ratings[detailedRating.QuestionId] = (int)Math.Round(detailedRating.OverallRating);
            }
        }
    }
}
