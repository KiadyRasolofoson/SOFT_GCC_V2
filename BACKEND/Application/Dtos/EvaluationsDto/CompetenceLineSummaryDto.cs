namespace soft_carriere_competence.Application.Dtos.EvaluationsDto;

/// <summary>Ligne de compétence aplatie avec les libellés du poste et de la compétence associés.</summary>
public sealed record CompetenceLineSummaryDto(
    int CompetenceLineId,
    int SkillPositionId,
    string Description,
    string SkillName,
    string PositionName,
    int PositionId,
    int SkillId,
    int State);
