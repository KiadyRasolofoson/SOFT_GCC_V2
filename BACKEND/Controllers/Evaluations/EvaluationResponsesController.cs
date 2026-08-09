using Microsoft.AspNetCore.Mvc;

using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Controllers.Evaluations;

/// <summary>
/// Session de passation d'une évaluation : réponses du salarié, options de questions,
/// sauvegarde de progression et temps restant.
/// </summary>
[ApiController]
[Route("api/Evaluation")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
public sealed class EvaluationResponsesController : ControllerBase
{
    private readonly IEvaluationResponseService _responseService;

    public EvaluationResponsesController(IEvaluationResponseService responseService)
    {
        _responseService = responseService;
    }

    [HttpPost("evaluation/{evaluationId}/responses")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> SaveResponseAsync(
        int evaluationId,
        [FromBody] EvaluationResponseDto response)
    {
        await _responseService.SaveResponseAsync(evaluationId, response);

        return Ok(new ApiResponse<object>(Message: "Réponse enregistrée."));
    }

    [HttpGet("evaluation/{evaluationId}/responses")]
    [ProducesResponseType(typeof(IEnumerable<EvaluationResponses>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EvaluationResponses>>> GetResponsesAsync(int evaluationId)
    {
        return Ok(await _responseService.GetResponsesAsync(evaluationId));
    }

    [HttpGet("evaluation/{evaluationId}/responses/{questionId}")]
    [ProducesResponseType(typeof(EvaluationResponses), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvaluationResponses>> GetResponseAsync(int evaluationId, int questionId)
    {
        return Ok(await _responseService.GetRequiredResponseAsync(evaluationId, questionId));
    }

    [HttpPut("responses/{responseId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<object>>> UpdateResponseAsync(
        int responseId,
        [FromBody] EvaluationResponseDto response)
    {
        await _responseService.UpdateResponseAsync(responseId, response);

        return Ok(new ApiResponse<object>(Message: "Réponse mise à jour."));
    }

    [HttpDelete("responses/{responseId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteResponseAsync(int responseId)
    {
        await _responseService.DeleteResponseAsync(responseId);

        return NoContent();
    }

    [HttpGet("{evaluationId}/options")]
    [ProducesResponseType(typeof(Dictionary<int, List<EvaluationQuestionOptions>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Dictionary<int, List<EvaluationQuestionOptions>>>> GetQuestionOptionsAsync(
        int evaluationId)
    {
        return Ok(await _responseService.GetAllQuestionOptionsAsync(evaluationId));
    }

    [HttpPost("{evaluationId}/save-progress")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> SaveProgressAsync(
        int evaluationId,
        [FromBody] EvaluationProgressDto progress)
    {
        await _responseService.SaveProgressAsync(evaluationId, progress);

        return Ok(new ApiResponse<object>(Message: "Progression sauvegardée"));
    }

    [HttpGet("{evaluationId}/time-remaining")]
    [ProducesResponseType(typeof(TimeSpan), StatusCodes.Status200OK)]
    public async Task<ActionResult<TimeSpan>> GetTimeRemainingAsync(int evaluationId)
    {
        return Ok(await _responseService.GetTimeRemainingAsync(evaluationId));
    }

    [HttpPost("{evaluationId}/process-responses")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> ProcessResponsesAsync(int evaluationId)
    {
        var processed = await _responseService.ProcessResponsesAfterSubmissionAsync(evaluationId);

        return processed
            ? Ok(new ApiResponse<object>(Message: "Les réponses ont été traitées avec succès."))
            : StatusCode(StatusCodes.Status500InternalServerError,
                new ApiErrorResponse("Le traitement des réponses a échoué."));
    }
}
