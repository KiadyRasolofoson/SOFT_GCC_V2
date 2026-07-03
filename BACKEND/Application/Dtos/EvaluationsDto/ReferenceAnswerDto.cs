using System;
using System.Text.Json.Serialization;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    /// <summary>
    /// DTO pour les réponses de référence et les guides d'évaluation
    /// </summary>
    public class ReferenceAnswerDto
    {
        /// <summary>
        /// ID de la référence
        /// </summary>
        public int ReferenceAnswerId { get; set; }

        /// <summary>
        /// ID de la question associée
        /// </summary>
        public int QuestionId { get; set; }

        /// <summary>
        /// Texte de référence (réponse modèle)
        /// </summary>
        public string ReferenceText { get; set; }

        /// <summary>
        /// Lignes directrices pour l'évaluation
        /// </summary>
        public string EvaluationGuidelines { get; set; }

        /// <summary>
        /// Points clés attendus dans la réponse
        /// </summary>
        public string ExpectedKeyPoints { get; set; }

        /// <summary>
        /// Descriptions des niveaux de réponse (1-5)
        /// </summary>
        public string ScoreDescription1 { get; set; }
        public string ScoreDescription2 { get; set; }
        public string ScoreDescription3 { get; set; }
        public string ScoreDescription4 { get; set; }
        public string ScoreDescription5 { get; set; }

        /// <summary>
        /// Méthode utilitaire pour obtenir la description d'un score particulier
        /// </summary>
        /// <param name="score">Score entre 1 et 5</param>
        /// <returns>Description du niveau de score correspondant</returns>
        public string GetScoreDescription(int score)
        {
            return score switch
            {
                1 => ScoreDescription1 ?? "Niveau insuffisant",
                2 => ScoreDescription2 ?? "Niveau faible",
                3 => ScoreDescription3 ?? "Niveau moyen",
                4 => ScoreDescription4 ?? "Bon niveau",
                5 => ScoreDescription5 ?? "Excellent niveau",
                _ => "Niveau non défini"
            };
        }
    }
} 