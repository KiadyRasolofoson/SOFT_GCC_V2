namespace soft_carriere_competence.Application.Dtos.EvaluationsDto;

/// <summary>
/// Critères de recherche des questions d'évaluation. <see cref="PositionId"/> à 0 signifie
/// « tous les postes », <see cref="CompetenceLineId"/> nul signifie « toutes les compétences ».
/// </summary>
public sealed record EvaluationQuestionFilterDto(
    int EvaluationTypeId,
    int PositionId,
    int? CompetenceLineId);
