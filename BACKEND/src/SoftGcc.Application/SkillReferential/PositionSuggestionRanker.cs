using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Application.SkillReferential;

/// <summary>Exigence d'un poste issue de la matrice emplois-compétences.</summary>
public sealed record PositionRequirementRow(
    int PositionId,
    string PositionName,
    int SkillId,
    int ExpectedRank,
    string RequirementKind);

/// <summary>Poste suggéré, avec la part des exigences déjà satisfaites.</summary>
public sealed record PositionSuggestion(
    int PositionId,
    string PositionName,
    int MetCount,
    int ExpectedCount,
    int CriticalMetCount,
    int CriticalCount)
{
    /// <summary>Part des exigences critiques et requises déjà satisfaites.</summary>
    public double Coverage => ExpectedCount == 0 ? 0 : (double)MetCount / ExpectedCount;

    /// <summary>
    /// Part des exigences critiques satisfaites. Sert de score principal : c'est ce qui
    /// distingue réellement un poste. À défaut d'exigence critique, on retombe sur la
    /// couverture globale.
    /// </summary>
    public double CriticalCoverage =>
        CriticalCount == 0 ? Coverage : (double)CriticalMetCount / CriticalCount;
}

/// <summary>
/// Classe les postes par adéquation avec les niveaux acquis d'un employé.
///
/// Deux garde-fous, appris des données réelles :
/// - une compétence souhaitée ne doit jamais faire apparaître un poste (seules les
///   exigences critiques et requises comptent) ;
/// - le score principal est la couverture des exigences <em>critiques</em>, pas la
///   couverture globale : les compétences comportementales (travail en équipe,
///   communication…) sont requises partout mais rarement saisies dans les profils, si
///   bien qu'un seuil sur la couverture globale ne suggère plus aucun poste.
/// </summary>
public static class PositionSuggestionRanker
{
    public const double DefaultCriticalCoverageThreshold = 0.6;
    public const int DefaultLimit = 10;

    public static IReadOnlyList<PositionSuggestion> Rank(
        IEnumerable<PositionRequirementRow> requirements,
        IReadOnlyDictionary<int, int> acquiredRanks,
        double criticalCoverageThreshold = DefaultCriticalCoverageThreshold,
        int limit = DefaultLimit,
        int? excludePositionId = null)
    {
        if (acquiredRanks.Count == 0)
        {
            return [];
        }

        bool IsMet(PositionRequirementRow row) =>
            acquiredRanks.TryGetValue(row.SkillId, out var rank) && rank >= row.ExpectedRank;

        return requirements
            .Where(row => RequirementKind.CountsForCoverage(row.RequirementKind))
            .Where(row => excludePositionId is null || row.PositionId != excludePositionId)
            .GroupBy(row => new { row.PositionId, row.PositionName })
            .Select(position =>
            {
                var critical = position
                    .Where(row => row.RequirementKind == RequirementKind.Critical)
                    .ToList();
                return new PositionSuggestion(
                    position.Key.PositionId,
                    position.Key.PositionName,
                    position.Count(IsMet),
                    position.Count(),
                    critical.Count(IsMet),
                    critical.Count);
            })
            .Where(suggestion =>
                suggestion.MetCount > 0 && suggestion.CriticalCoverage >= criticalCoverageThreshold)
            .OrderByDescending(suggestion => suggestion.CriticalCoverage)
            .ThenByDescending(suggestion => suggestion.Coverage)
            .ThenByDescending(suggestion => suggestion.MetCount)
            .ThenBy(suggestion => suggestion.PositionName, StringComparer.Ordinal)
            .Take(limit)
            .ToList();
    }
}
