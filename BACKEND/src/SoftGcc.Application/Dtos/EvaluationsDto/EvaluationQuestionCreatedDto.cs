namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>Représentation d'une question fraîchement créée, renvoyée avec le 201 Created.</summary>
public sealed record EvaluationQuestionCreatedDto(
    int QuestionId,
    string Question,
    int EvaluationTypeId,
    int PositionId,
    int? CompetenceLineId,
    int ResponseTypeId,
    int State);
