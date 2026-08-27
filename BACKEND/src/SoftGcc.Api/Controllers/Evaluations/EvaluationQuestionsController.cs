using System.ComponentModel.DataAnnotations;

using Microsoft.AspNetCore.Mvc;

using SoftGcc.Application.Common;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Domain.Entities.Evaluations;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.Evaluations;

/// <summary>
/// Référentiel des questions d'évaluation. Le préfixe historique « api/Evaluation » est conservé :
/// le client React cible ces URLs en dur, les renommer en kebab-case pluriel serait une rupture de contrat.
/// </summary>
[ApiController]
[Route("api/Evaluation")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
[RequirePermission("EVALUATION_SETTINGS","MANAGE_EVALUATIONS")]
public sealed class EvaluationQuestionsController : ControllerBase
{
    private readonly IEvaluationQuestionService _questionService;

    public EvaluationQuestionsController(IEvaluationQuestionService questionService)
    {
        _questionService = questionService;
    }

    [HttpPost("questions")]
    [ProducesResponseType(typeof(EvaluationQuestionCreatedDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EvaluationQuestionCreatedDto>> CreateQuestionAsync(
        [FromBody] EvaluationQuestionDto question)
    {
        var createdQuestion = await _questionService.CreateQuestionAsync(question);

        return CreatedAtAction(nameof(GetQuestionAsync), new { id = createdQuestion.QuestionId }, createdQuestion);
    }

    [HttpGet("questionsAll")]
    [ProducesResponseType(typeof(IEnumerable<EvaluationQuestion>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EvaluationQuestion>>> GetAllQuestionsAsync()
    {
        return Ok(await _questionService.GetAllEvaluationQuestionsAsync());
    }

    [HttpGet("questions/{id}")]
    [ProducesResponseType(typeof(EvaluationQuestion), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvaluationQuestion>> GetQuestionAsync(int id)
    {
        return Ok(await _questionService.GetRequiredQuestionAsync(id));
    }

    [HttpGet("questions/{id}/options")]
    [ProducesResponseType(typeof(IEnumerable<EvaluationQuestionOptionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<EvaluationQuestionOptionDto>>> GetQuestionOptionsAsync(int id)
    {
        return Ok(await _questionService.GetQuestionOptionsAsync(id));
    }

    [HttpGet("question-option-summaries")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<object>>> GetQuestionOptionSummariesAsync()
    {
        return Ok(await _questionService.GetQuestionOptionSummariesAsync());
    }

    /// <summary>
    /// Recherche dans la banque de questions. L'axe principal est le référentiel de
    /// compétences (domaine, famille, compétence) ; le poste n'est qu'un filtre facultatif.
    /// </summary>
    [HttpGet("questions")]
    [ProducesResponseType(typeof(IEnumerable<EvaluationQuestion>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EvaluationQuestion>>> GetQuestionsAsync(
        [FromQuery] int evaluationTypeId,
        [FromQuery] int? positionId = null,
        [FromQuery] int? competenceLineId = null,
        [FromQuery] int? skillId = null,
        [FromQuery] int? familyId = null,
        [FromQuery] int? domainId = null)
    {
        var filter = new EvaluationQuestionFilterDto(
            evaluationTypeId, positionId, competenceLineId, skillId, familyId, domainId);

        return Ok(await _questionService.FindQuestionsAsync(filter));
    }

    [HttpGet("questions/paginated")]
    [ProducesResponseType(typeof(PagedResult<EvaluationQuestionSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EvaluationQuestionSummaryDto>>> GetQuestionPageAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize)
    {
        return Ok(await _questionService.GetQuestionSummariesAsync(PageRequest.Create(pageNumber, pageSize)));
    }

    [HttpPut("questions/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> UpdateQuestionAsync(int id, [FromBody] EvaluationQuestionDto question)
    {
        await _questionService.UpdateQuestionAsync(id, question);

        return NoContent();
    }

    [HttpDelete("questions/{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteQuestionAsync(int id)
    {
        await _questionService.DeleteQuestionAsync(id);

        return NoContent();
    }

    [HttpGet("{evaluationTypeId}/questions")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<object>>> GetQuestionsByTypeAsync(int evaluationTypeId)
    {
        return Ok(await _questionService.GetQuestionsByEvaluationTypeAsync(evaluationTypeId));
    }

    [HttpGet("{evaluationTypeId}/questions/paginated")]
    [ProducesResponseType(typeof(PagedResult<EvaluationQuestion>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<EvaluationQuestion>>> GetQuestionPageByTypeAsync(
        int evaluationTypeId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = PageRequest.DefaultPageSize)
    {
        var page = PageRequest.Create(pageNumber, pageSize);

        return Ok(await _questionService.GetQuestionsByTypeAsync(evaluationTypeId, page));
    }

    [HttpPost("questions/update-time")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateQuestionTimesAsync(
        [FromBody] [MinLength(1, ErrorMessage = "Aucune question à mettre à jour.")]
        List<QuestionTimeUpdateDto> questions)
    {
        await _questionService.UpdateQuestionsTimeAsync(questions);

        return Ok(new ApiResponse<object>(Message: "Temps des questions mis à jour avec succès"));
    }
}
