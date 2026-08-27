namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>
/// Question proposée lors de la planification, enrichie de sa position dans le référentiel
/// (domaine → famille → compétence) pour permettre le regroupement dans le wizard.
/// <see cref="CompetenceLineId"/> est résolu pour le poste de l'employé : c'est lui qui
/// portera le rang de maîtrise lors de la notation.
/// </summary>
public sealed record PlanningQuestionDto(
    int QuestionId,
    string Question,
    int EvaluationTypeId,
    int? SkillId,
    string? SkillName,
    int? FamilyId,
    string? FamilyName,
    int? DomainId,
    string? DomainName,
    int? PositionId,
    int? CompetenceLineId,
    int ResponseTypeId,
    string? ResponseTypeName);
