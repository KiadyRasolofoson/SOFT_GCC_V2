namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>
/// Critères de recherche des questions d'évaluation. Les questions sont organisées par
/// compétence du référentiel (domaine → famille → compétence) ; le poste n'est qu'un
/// filtre facultatif. Un critère nul ou à 0 signifie « tous ».
/// </summary>
public sealed record EvaluationQuestionFilterDto(
    int EvaluationTypeId,
    int? PositionId,
    int? CompetenceLineId,
    int? SkillId = null,
    int? FamilyId = null,
    int? DomainId = null);
