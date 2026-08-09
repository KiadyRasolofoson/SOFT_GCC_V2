using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Application.Interfaces;
using soft_carriere_competence.Middleware;

namespace soft_carriere_competence.Controllers.Evaluations;

/// <summary>
/// Cycle de vie d'une évaluation : consultation du dossier, calcul de moyenne,
/// enregistrement des résultats, soumission par le salarié et validation hiérarchique.
/// </summary>
[ApiController]
[Route("api/Evaluation")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
public sealed class EvaluationsController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;

    public EvaluationsController(IEvaluationService evaluationService)
    {
        _evaluationService = evaluationService;
    }

    /// <summary>
    /// Sans <c>[Authorize]</c>, cet endpoint répondait « jeton valide » même en l'absence de jeton :
    /// c'est l'authentification du pipeline qui constitue la vérification.
    /// </summary>
    [HttpGet("validate-token")]
    [Authorize]
    [ProducesResponseType(typeof(TokenValidationDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public ActionResult<TokenValidationDto> ValidateToken()
    {
        return Ok(new TokenValidationDto(Valid: true));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "CanViewEvaluation")]
    [AuditTrail("Evaluation", "id")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetEvaluationDetailsAsync(int id)
    {
        return Ok(await _evaluationService.GetRequiredEvaluationDetailsAsync(id));
    }

    [HttpPost("calculate-average")]
    [ProducesResponseType(typeof(AverageRatingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<AverageRatingDto> CalculateAverage([FromBody] Dictionary<int, int> ratings)
    {
        if (ratings is null || ratings.Count == 0)
        {
            return BadRequest(new ApiErrorResponse("Aucune note fournie."));
        }

        var average = _evaluationService.CalculateAverageRating(ratings);

        return Ok(new AverageRatingDto(Math.Round(average, 2)));
    }

    [HttpPost("save-evaluation-results")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<object>>> SaveResultsAsync([FromBody] EvaluationResultsDto results)
    {
        await _evaluationService.SaveEvaluationResultsAsync(results);

        return Ok(new ApiResponse<object>(Message: "Evaluation results saved successfully."));
    }

    [HttpPost("validate-evaluation")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> ValidateEvaluationAsync(
        [FromBody] EvaluationValidationDto validation)
    {
        var validated = await _evaluationService.ValidateEvaluationAsync(validation);

        return validated
            ? Ok(new ApiResponse<object>(Message: "Evaluation validated successfully."))
            : BadRequest(new ApiErrorResponse("La validation de l'évaluation a échoué."));
    }

    [HttpPost("{evaluationId}/submit")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<object>>> SubmitAsync(
        int evaluationId,
        [FromBody] EvaluationSubmissionDto submission)
    {
        if (submission.Responses is null)
        {
            return BadRequest(new ApiErrorResponse("Aucune réponse fournie."));
        }

        await _evaluationService.SubmitEvaluationAsync(evaluationId, submission);

        return Ok(new ApiResponse<object>(Message: "Évaluation soumise avec succès."));
    }

    [HttpGet("evaluation/{evaluationId}/selected-questions")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<object>>> GetSelectedQuestionsAsync(int evaluationId)
    {
        return Ok(await _evaluationService.GetSelectedQuestionsAndResponsesAsync(evaluationId));
    }
}
