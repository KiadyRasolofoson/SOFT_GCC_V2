namespace SoftGcc.Domain.Interfaces.Evaluations
{
    /// <summary>
    /// Critères de recherche des questions d'évaluation. Une question appartient à une
    /// compétence du référentiel : <see cref="DomainId"/>, <see cref="FamilyId"/> et
    /// <see cref="SkillId"/> forment l'axe principal, <see cref="PositionId"/> n'est qu'un
    /// filtre facultatif. Tout critère nul ou à 0 signifie « tous ».
    /// </summary>
    public sealed record EvaluationQuestionQuery(
        int? EvaluationTypeId = null,
        int? PositionId = null,
        int? CompetenceLineId = null,
        int? SkillId = null,
        int? FamilyId = null,
        int? DomainId = null,
        bool ActiveOnly = false);
}
