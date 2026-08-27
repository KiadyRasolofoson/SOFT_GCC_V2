namespace SoftGcc.Application.Dtos.EvaluationsDto;

/// <summary>
/// Arbre du référentiel de compétences exposé au module d'évaluation pour composer et
/// filtrer les questions : domaine → famille → compétence.
/// </summary>
public sealed record CompetenceDomainNodeDto(
    int DomainId,
    string DomainCode,
    string DomainName,
    IReadOnlyList<CompetenceFamilyNodeDto> Families);

public sealed record CompetenceFamilyNodeDto(
    int FamilyId,
    string FamilyCode,
    string FamilyName,
    IReadOnlyList<CompetenceSkillNodeDto> Skills);

public sealed record CompetenceSkillNodeDto(
    int SkillId,
    string SkillCode,
    string SkillName,
    string Category);
