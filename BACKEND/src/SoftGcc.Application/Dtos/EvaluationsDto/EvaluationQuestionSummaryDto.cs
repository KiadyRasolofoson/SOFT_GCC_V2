namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>
/// Question d'évaluation aplatie avec les libellés de ses références, pour affichage en liste.
/// La compétence porte la hiérarchie du référentiel (domaine → famille) ; le poste est facultatif.
/// </summary>
public sealed record EvaluationQuestionSummaryDto(
    int Id,
    string Question,
    int EvaluationTypeId,
    string? EvaluationTypeName,
    int? SkillId,
    string? SkillName,
    int? FamilyId,
    string? FamilyName,
    int? DomainId,
    string? DomainName,
    int? PositionId,
    string? PositionName,
    int? CompetenceLineId,
    string? CompetenceName,
    int ResponseTypeId,
    string? ResponseTypeName,
    int State);
