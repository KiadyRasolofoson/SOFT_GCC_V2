using Microsoft.AspNetCore.Mvc;

using SoftGcc.Application.Common;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.Evaluations;

using SoftGcc.Application.Authorization;
using Microsoft.AspNetCore.Authorization;
namespace SoftGcc.Api.Controllers.Evaluations;

/// <summary>
/// Données de référence nécessaires pour composer un questionnaire : types d'évaluation,
/// postes, modèles, lignes de compétence et types de réponse.
/// </summary>
[ApiController]
[Route("api/Evaluation")]
[Produces("application/json")]
[ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
[RequirePermission("EVALUATION_SETTINGS","MANAGE_EVALUATIONS","VIEW_EVALUATIONS")]
public sealed class EvaluationReferencesController : ControllerBase
{
    private readonly IEvaluationService _evaluationService;
    private readonly ICompetenceLineService _competenceLineService;
    private readonly IResponseTypeService _responseTypeService;

    public EvaluationReferencesController(
        IEvaluationService evaluationService,
        ICompetenceLineService competenceLineService,
        IResponseTypeService responseTypeService)
    {
        _evaluationService = evaluationService;
        _competenceLineService = competenceLineService;
        _responseTypeService = responseTypeService;
    }

    [HttpGet("types")]
    [ProducesResponseType(typeof(IEnumerable<EvaluationType>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<EvaluationType>>> GetEvaluationTypesAsync()
    {
        var evaluationTypes = await _evaluationService.GetEvaluationTypeAsync();

        return evaluationTypes?.Any() == true
            ? Ok(evaluationTypes)
            : NotFound(new ApiErrorResponse("Aucun type d'évaluation n'est défini."));
    }

    [HttpGet("postes")]
    [ProducesResponseType(typeof(IEnumerable<Position>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IEnumerable<Position>>> GetPositionsAsync()
    {
        var positions = await _evaluationService.GetPostesAsync();

        return positions?.Any() == true
            ? Ok(positions)
            : NotFound(new ApiErrorResponse("Aucun poste n'est défini."));
    }

    [HttpGet("templates")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<object>>> GetTemplatesAsync()
    {
        return Ok(await _evaluationService.GetEvaluationTemplatesAsync());
    }

    [HttpGet("competence-lines")]
    [ProducesResponseType(typeof(IEnumerable<CompetenceLineSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CompetenceLineSummaryDto>>> GetCompetenceLinesAsync()
    {
        return Ok(await _competenceLineService.GetSummariesAsync());
    }

    [HttpGet("response-types")]
    [ProducesResponseType(typeof(IEnumerable<ResponseTypeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ResponseTypeSummaryDto>>> GetResponseTypesAsync()
    {
        return Ok(await _responseTypeService.GetSummariesAsync());
    }
}
