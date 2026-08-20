namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>Question d'évaluation aplatie avec les libellés de ses références, pour affichage en liste.</summary>
public sealed record EvaluationQuestionSummaryDto(
    int Id,
    string Question,
    int EvaluationTypeId,
    string? EvaluationTypeName,
    int PositionId,
    string? PositionName,
    int? CompetenceLineId,
    string? CompetenceName,
    int ResponseTypeId,
    string? ResponseTypeName,
    int State);
