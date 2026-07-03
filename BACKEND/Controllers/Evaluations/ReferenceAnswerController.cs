using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReferenceAnswerController : ControllerBase
    {
        private readonly ReferenceAnswerService _referenceAnswerService;

        public ReferenceAnswerController(ReferenceAnswerService referenceAnswerService)
        {
            _referenceAnswerService = referenceAnswerService;
        }

        /// <summary>
        /// Récupère la réponse de référence pour une question spécifique
        /// </summary>
        /// <param name="questionId">ID de la question</param>
        /// <returns>Réponse de référence</returns>
        [HttpGet("question/{questionId}")]
        public async Task<IActionResult> GetReferenceAnswerForQuestion(int questionId)
        {
            try
            {
                var reference = await _referenceAnswerService.GetReferenceAnswerForQuestionAsync(questionId);
                if (reference == null)
                {
                    return NotFound($"Aucune référence trouvée pour la question ID {questionId}");
                }
                return Ok(reference);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Récupère les réponses de référence pour plusieurs questions
        /// </summary>
        /// <param name="questionIds">Liste des IDs de questions</param>
        /// <returns>Dictionnaire de réponses de référence</returns>
        [HttpPost("questions")]
        public async Task<IActionResult> GetReferenceAnswersForQuestions([FromBody] List<int> questionIds)
        {
            if (questionIds == null || !questionIds.Any())
            {
                return BadRequest("La liste des IDs de questions ne peut pas être vide");
            }

            try
            {
                var references = await _referenceAnswerService.GetReferenceAnswersForQuestionsAsync(questionIds);
                return Ok(references);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Crée ou met à jour une réponse de référence
        /// </summary>
        /// <param name="dto">Données de la réponse de référence</param>
        /// <returns>ID de la réponse de référence créée ou mise à jour</returns>
        [HttpPost]
        public async Task<IActionResult> SaveReferenceAnswer([FromBody] ReferenceAnswerDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Les données de référence ne peuvent pas être nulles");
            }

            try
            {
                // Dans un cas réel, l'ID de l'utilisateur serait extrait du token d'authentification
                int userId = 1; // Utilisateur par défaut pour cet exemple
                var referenceId = await _referenceAnswerService.SaveReferenceAnswerAsync(dto, userId);
                return Ok(new { id = referenceId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Supprime une réponse de référence
        /// </summary>
        /// <param name="id">ID de la réponse de référence</param>
        /// <returns>Résultat de la suppression</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReferenceAnswer(int id)
        {
            try
            {
                var result = await _referenceAnswerService.DeleteReferenceAnswerAsync(id);
                if (!result)
                {
                    return NotFound($"Réponse de référence avec ID {id} non trouvée");
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 