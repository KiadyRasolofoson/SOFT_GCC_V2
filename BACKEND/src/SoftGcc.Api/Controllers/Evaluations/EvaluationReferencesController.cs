using Microsoft.AspNetCore.Mvc;

using SoftGcc.Application.Common;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Application.Interfaces;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.SkillReferential;

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
    private readonly ISkillReferentialService _skillReferentialService;

    public EvaluationReferencesController(
        IEvaluationService evaluationService,
        ICompetenceLineService competenceLineService,
        IResponseTypeService responseTypeService,
        ISkillReferentialService skillReferentialService)
    {
        _evaluationService = evaluationService;
        _competenceLineService = competenceLineService;
        _responseTypeService = responseTypeService;
        _skillReferentialService = skillReferentialService;
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

    /// <summary>
    /// Arbre du référentiel de compétences (domaine → famille → compétence publiée) : c'est
    /// l'axe sur lequel les questions d'évaluation sont désormais définies et filtrées.
    /// Exposé ici pour que les RH y accèdent sans les droits du module référentiel.
    /// </summary>
    [HttpGet("competence-domains")]
    [ProducesResponseType(typeof(IEnumerable<CompetenceDomainNodeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CompetenceDomainNodeDto>>> GetCompetenceDomainsAsync(
        CancellationToken cancellationToken)
    {
        var catalog = await _skillReferentialService.GetCatalogAsync(
            new SkillCatalogQuery { State = SkillLifecycle.Active },
            cancellationToken);

        var domains = catalog
            .Select(domain => new CompetenceDomainNodeDto(
                domain.DomainId,
                domain.DomainCode,
                domain.DomainName,
                domain.Families
                    .Select(family => new CompetenceFamilyNodeDto(
                        family.FamilyId,
                        family.Code,
                        family.Name,
                        family.Skills
                            .Select(skill => new CompetenceSkillNodeDto(
                                skill.SkillId,
                                skill.Code,
                                skill.Name,
                                skill.Category))
                            .ToList()))
                    .Where(family => family.Skills.Count > 0)
                    .ToList()))
            .Where(domain => domain.Families.Count > 0)
            .ToList();

        return Ok(domains);
    }

    [HttpGet("response-types")]
    [ProducesResponseType(typeof(IEnumerable<ResponseTypeSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ResponseTypeSummaryDto>>> GetResponseTypesAsync()
    {
        return Ok(await _responseTypeService.GetSummariesAsync());
    }
}
