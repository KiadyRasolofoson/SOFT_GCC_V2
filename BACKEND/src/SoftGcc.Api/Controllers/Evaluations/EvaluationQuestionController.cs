using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Api.Controllers.Evaluations
{
    [ApiController]
    [Route("api/[controller]")]
    [RequirePermission("EVALUATION_SETTINGS", "MANAGE_EVALUATIONS")]
    public class EvaluationQuestionController : ControllerBase
    {
        private readonly EvaluationService _evaluationService;
        private readonly EvaluationResponseService _responseService;

        public EvaluationQuestionController(
            EvaluationService evaluationService,
            EvaluationResponseService responseService)
        {
            _evaluationService = evaluationService;
            _responseService = responseService;
        }

        [HttpGet("questions")]
        public async Task<IActionResult> GetEvaluationQuestions(
            [FromQuery] int positionId,
            [FromQuery] int? evaluationTypeId = null,
            [FromQuery] int? competenceLineId = null)
        {
            try
            {
                Console.WriteLine($"Requête reçue - positionId: {positionId}, evaluationTypeId: {evaluationTypeId}, competenceLineId: {competenceLineId}");

                if (evaluationTypeId.HasValue && competenceLineId.HasValue)
                {
                    var questions = await _evaluationService.GetEvaluationQuestionsByTypePositionAndCompetenceAsync(
                        evaluationTypeId.Value,
                        positionId,
                        competenceLineId.Value
                    );

                    Console.WriteLine($"Nombre de questions trouvées : {questions.Count()}");
                    
                    if (!questions.Any())
                    {
                        // Vérifier si des questions existent pour cette position
                        var questionsForPosition = await _evaluationService.GetEvaluationQuestionsByPositionAsync(positionId);
                        Console.WriteLine($"Nombre total de questions pour cette position : {questionsForPosition.Count()}");
                        
                        return Ok(new { 
                            message = "Aucune question trouvée pour cette combinaison de paramètres",
                            questions = new List<EvaluationQuestion>(),
                            totalQuestionsForPosition = questionsForPosition.Count()
                        });
                    }

                    return Ok(questions);
                }
                else
                {
                    var questions = await _evaluationService.GetEvaluationQuestionsByPositionAsync(positionId);
                    Console.WriteLine($"Nombre de questions trouvées pour la position : {questions.Count()}");
                    return Ok(questions);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la récupération des questions : {ex.Message}");
                Console.WriteLine($"Stack trace : {ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message, details = ex.StackTrace });
            }
        }

        [HttpGet("questions/{id}")]
        public async Task<IActionResult> GetEvaluationQuestionById(int id)
        {
            try
            {
                var question = await _evaluationService.GetEvaluationQuestionByIdAsync(id);
                if (question == null)
                {
                    return NotFound($"Question with ID {id} not found.");
                }
                return Ok(question);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("paginated")]
        public async Task<IActionResult> GetPaginatedEvaluationQuestions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var questions = await _evaluationService.GetPaginatedEvaluationQuestionsAsync(pageNumber, pageSize);
                return Ok(questions);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("evaluation/{evaluationId}/selected-questions")]
        public async Task<IActionResult> GetSelectedQuestionsAndResponses(int evaluationId)
        {
            try
            {
                var result = await _evaluationService.GetSelectedQuestionsAndResponsesForQuestionControllerAsync(evaluationId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("evaluation/{evaluationId}/responses")]
        public async Task<IActionResult> SaveResponse(int evaluationId, [FromBody] EvaluationResponseDto response)
        {
            try
            {
                await _responseService.SaveResponseAsync(evaluationId, response);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("evaluation/{evaluationId}/responses")]
        public async Task<IActionResult> GetResponses(int evaluationId)
        {
            try
            {
                var responses = await _responseService.GetResponsesAsync(evaluationId);
                return Ok(responses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("evaluation/{evaluationId}/responses/{questionId}")]
        public async Task<IActionResult> GetResponse(int evaluationId, int questionId)
        {
            try
            {
                var response = await _responseService.GetResponseAsync(evaluationId, questionId);
                if (response == null)
                {
                    return NotFound();
                }
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPut("responses/{responseId}")]
        public async Task<IActionResult> UpdateResponse(int responseId, [FromBody] EvaluationResponseDto response)
        {
            try
            {
                await _responseService.UpdateResponseAsync(responseId, response);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpDelete("responses/{responseId}")]
        public async Task<IActionResult> DeleteResponse(int responseId)
        {
            try
            {
                await _responseService.DeleteResponseAsync(responseId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
} 