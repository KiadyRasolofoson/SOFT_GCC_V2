using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Services.Evaluations;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Controllers.Evaluations
{
    [ApiController]
    [Route("api/[controller]")]
    public class EvaluationQuestionController : ControllerBase
    {
        private readonly EvaluationService _evaluationService;
        private readonly EvaluationResponseService _responseService;
        private readonly ApplicationDbContext _context;

        public EvaluationQuestionController(
            EvaluationService evaluationService,
            ApplicationDbContext context,
            EvaluationResponseService responseService)
        {
            _evaluationService = evaluationService;
            _context = context;
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
                var selectedQuestions = await _context.evaluationSelectedQuestions
                    .Where(esq => esq.EvaluationId == evaluationId)
                    .Join(_context.evaluationQuestions,
                        esq => esq.QuestionId,
                        eq => eq.questionId,
                        (esq, eq) => new
                        {
                            QuestionId = eq.questionId,
                            QuestionText = eq.question,
                            CompetenceLineId = eq.CompetenceLineId,
                            ResponseTypeId = eq.ResponseTypeId,
                            Response = _context.evaluationResponses
                                .FirstOrDefault(er => er.EvaluationId == evaluationId && er.QuestionId == eq.questionId)
                        })
                    .Join(_context.ResponseTypes,
                        q => q.ResponseTypeId,
                        rt => rt.ResponseTypeId,
                        (q, rt) => new
                        {
                            q.QuestionId,
                            q.QuestionText,
                            q.CompetenceLineId,
                            ResponseTypeId = q.ResponseTypeId,
                            ResponseType = rt.TypeName,
                            q.Response
                        })
                    .Join(_context.competenceLines.Include(cl => cl.SkillPosition).ThenInclude(sp => sp.Skill),
                        q => q.CompetenceLineId,
                        cl => cl.CompetenceLineId,
                        (q, cl) => new
                        {
                            q.QuestionId,
                            q.QuestionText,
                            q.ResponseTypeId,
                            q.ResponseType,
                            CompetenceLine = new
                            {
                                cl.CompetenceLineId,
                                CompetenceName = cl.SkillPosition.Skill.Name ?? cl.Description
                            },
                            q.Response
                        })
                    .ToListAsync();

                return Ok(selectedQuestions);
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