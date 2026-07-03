using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class ReferenceAnswerService
    {
        private readonly ApplicationDbContext _context;

        public ReferenceAnswerService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Récupère la réponse de référence pour une question spécifique
        /// </summary>
        /// <param name="questionId">ID de la question</param>
        /// <returns>DTO de la réponse de référence ou null si inexistante</returns>
        public async Task<ReferenceAnswerDto> GetReferenceAnswerForQuestionAsync(int questionId)
        {
            var referenceAnswer = await _context.evaluationReferenceAnswers
                .Where(ra => ra.QuestionId == questionId && ra.State == 1)
                .FirstOrDefaultAsync();

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
            var referenceAnswers = await _context.evaluationReferenceAnswers
                .Where(ra => questionIds.Contains(ra.QuestionId) && ra.State == 1)
                .ToListAsync();

            return referenceAnswers.ToDictionary(
                ra => ra.QuestionId,
                ra => MapToDto(ra)
            );
        }

        /// <summary>
        /// Crée ou met à jour une réponse de référence
        /// </summary>
        /// <param name="dto">Données de la réponse de référence</param>
        /// <param name="userId">ID de l'utilisateur effectuant l'action</param>
        /// <returns>ID de la réponse de référence</returns>
        public async Task<int> SaveReferenceAnswerAsync(ReferenceAnswerDto dto, int userId)
        {
            var existingReference = await _context.evaluationReferenceAnswers
                .FirstOrDefaultAsync(ra => ra.QuestionId == dto.QuestionId);

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

                await _context.SaveChangesAsync();
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

                _context.evaluationReferenceAnswers.Add(newReference);
                await _context.SaveChangesAsync();
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
            var referenceAnswer = await _context.evaluationReferenceAnswers
                .FindAsync(referenceAnswerId);

            if (referenceAnswer == null)
                return false;

            // Suppression logique
            referenceAnswer.State = 0;
            await _context.SaveChangesAsync();
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