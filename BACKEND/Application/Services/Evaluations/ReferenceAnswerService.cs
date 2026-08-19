using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class ReferenceAnswerService
    {
        private readonly IGenericRepository<EvaluationReferenceAnswer> _repository;

        public ReferenceAnswerService(IGenericRepository<EvaluationReferenceAnswer> repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Récupère la réponse de référence pour une question spécifique
        /// </summary>
        /// <param name="questionId">ID de la question</param>
        /// <returns>DTO de la réponse de référence ou null si inexistante</returns>
        public async Task<ReferenceAnswerDto?> GetReferenceAnswerForQuestionAsync(int questionId)
        {
            var referenceAnswer = await _repository
                .GetFirstOrDefaultAsync(ra => ra.QuestionId == questionId && ra.State == 1);

            if (referenceAnswer == null)
                return null;

            return MapToDto(referenceAnswer);
        }

        /// <summary>
        /// Récupère toutes les réponses de référence pour un ensemble de questions
        /// </summary>
        /// <param name="questionIds">Liste des IDs de questions</param>
        /// <returns>Dictionnaire de réponses de référence, indexé par ID de question</returns>
        public async Task<Dictionary<int, ReferenceAnswerDto>> GetReferenceAnswersForQuestionsAsync(IEnumerable<int> questionIds)
        {
            var idList = questionIds.ToList();
            var allAnswers = await _repository.GetAllAsync();
            var referenceAnswers = allAnswers
                .Where(ra => idList.Contains(ra.QuestionId) && ra.State == 1)
                .ToList();

            return referenceAnswers
                .GroupBy(ra => ra.QuestionId)
                .ToDictionary(g => g.Key, g => MapToDto(g.First()));
        }

        /// <summary>
        /// Crée ou met à jour une réponse de référence
        /// </summary>
        /// <param name="dto">Données de la réponse de référence</param>
        /// <param name="userId">ID de l'utilisateur effectuant l'action</param>
        /// <returns>ID de la réponse de référence</returns>
        public async Task<int> SaveReferenceAnswerAsync(ReferenceAnswerDto dto, int userId)
        {
            var existingReference = await _repository
                .GetFirstOrDefaultAsync(ra => ra.QuestionId == dto.QuestionId);

            if (existingReference != null)
            {
                // Mise à jour
                existingReference.ReferenceText = dto.ReferenceText;
                existingReference.EvaluationGuidelines = dto.EvaluationGuidelines;
                existingReference.ExpectedKeyPoints = dto.ExpectedKeyPoints;
                existingReference.ScoreDescription1 = dto.ScoreDescription1;
                existingReference.ScoreDescription2 = dto.ScoreDescription2;
                existingReference.ScoreDescription3 = dto.ScoreDescription3;
                existingReference.ScoreDescription4 = dto.ScoreDescription4;
                existingReference.ScoreDescription5 = dto.ScoreDescription5;
                existingReference.UpdatedAt = DateTime.UtcNow;
                existingReference.UpdatedById = userId;

                await _repository.UpdateAsync(existingReference);
                return existingReference.ReferenceAnswerId;
            }
            else
            {
                // Création
                var newReference = new EvaluationReferenceAnswer
                {
                    QuestionId = dto.QuestionId,
                    ReferenceText = dto.ReferenceText,
                    EvaluationGuidelines = dto.EvaluationGuidelines,
                    ExpectedKeyPoints = dto.ExpectedKeyPoints,
                    ScoreDescription1 = dto.ScoreDescription1,
                    ScoreDescription2 = dto.ScoreDescription2,
                    ScoreDescription3 = dto.ScoreDescription3,
                    ScoreDescription4 = dto.ScoreDescription4,
                    ScoreDescription5 = dto.ScoreDescription5,
                    CreatedAt = DateTime.UtcNow,
                    CreatedById = userId,
                    State = 1
                };

                await _repository.CreateAsync(newReference);
                return newReference.ReferenceAnswerId;
            }
        }

        /// <summary>
        /// Supprime une réponse de référence
        /// </summary>
        /// <param name="referenceAnswerId">ID de la réponse de référence</param>
        /// <returns>Vrai si la suppression a réussi</returns>
        public async Task<bool> DeleteReferenceAnswerAsync(int referenceAnswerId)
        {
            var referenceAnswer = await _repository.GetByIdAsync(referenceAnswerId);

            if (referenceAnswer == null)
                return false;

            // Suppression logique
            referenceAnswer.State = 0;
            await _repository.UpdateAsync(referenceAnswer);
            return true;
        }

        /// <summary>
        /// Convertit une entité en DTO
        /// </summary>
        private ReferenceAnswerDto MapToDto(EvaluationReferenceAnswer entity)
        {
            return new ReferenceAnswerDto
            {
                ReferenceAnswerId = entity.ReferenceAnswerId,
                QuestionId = entity.QuestionId,
                ReferenceText = entity.ReferenceText,
                EvaluationGuidelines = entity.EvaluationGuidelines,
                ExpectedKeyPoints = entity.ExpectedKeyPoints,
                ScoreDescription1 = entity.ScoreDescription1,
                ScoreDescription2 = entity.ScoreDescription2,
                ScoreDescription3 = entity.ScoreDescription3,
                ScoreDescription4 = entity.ScoreDescription4,
                ScoreDescription5 = entity.ScoreDescription5
            };
        }
    }
} 