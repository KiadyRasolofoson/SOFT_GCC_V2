using System.Text.Json.Serialization;

namespace soft_carriere_competence.Application.Dtos.EvaluationsDto
{
    /// <summary>
    /// DTO pour représenter une notation multicritères pour une question d'évaluation
    /// </summary>
    public class MultiCriteriaRatingDto
    {
        /// <summary>
        /// ID de la question
        /// </summary>
        public int QuestionId { get; set; }

        /// <summary>
        /// Note de pertinence de la réponse (1-5)
        /// </summary>
        public decimal? Relevance { get; set; }

        /// <summary>
        /// Note du niveau technique de la réponse (1-5)
        /// </summary>
        public decimal? Technical { get; set; }

        /// <summary>
        /// Note de clarté d'expression de la réponse (1-5)
        /// </summary>
        public decimal? Clarity { get; set; }

        /// <summary>
        /// Commentaire justificatif de l'évaluation
        /// </summary>
        public string? Comment { get; set; }

        /// <summary>
        /// Note globale calculée (moyenne des critères)
        /// </summary>
        public decimal OverallRating { get; set; }

        /// <summary>
        /// Convertir en JSON pour stockage dans la base de données
        /// </summary>
        /// <returns>Représentation JSON de l'objet</returns>
        public string ToJson()
        {
            return System.Text.Json.JsonSerializer.Serialize(this);
        }

        /// <summary>
        /// Créer depuis une chaîne JSON
        /// </summary>
        /// <param name="json">Chaîne JSON</param>
        /// <returns>Instance de MultiCriteriaRatingDto</returns>
        public static MultiCriteriaRatingDto? FromJson(string json)
        {
            if (string.IsNullOrEmpty(json))
                return null;

            try
            {
                return System.Text.Json.JsonSerializer.Deserialize<MultiCriteriaRatingDto>(json);
            }
            catch
            {
                // Si le parsing échoue, retourner null
                return null;
            }
        }

        /// <summary>
        /// Calculer la note globale à partir des critères individuels
        /// </summary>
        /// <returns>Note globale (moyenne arrondie)</returns>
        public decimal CalculateOverallRating()
        {
            var ratings = new List<decimal>();
            
            if (Relevance.HasValue && Relevance.Value > 0)
                ratings.Add(Relevance.Value);
                
            if (Technical.HasValue && Technical.Value > 0)
                ratings.Add(Technical.Value);
                
            if (Clarity.HasValue && Clarity.Value > 0)
                ratings.Add(Clarity.Value);

            if (ratings.Count == 0)
                return 0;

            // Calculer la moyenne arrondie
            return (decimal)Math.Round(ratings.Average());
        }
    }
} 