using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Application.Services.Evaluations;

/// <summary>
/// Tri d'affichage des écarts pour la discussion d'entretien :
/// Critical gap/missing → autres gap/missing (Required puis Desired) → ok.
/// </summary>
public static class InterviewSkillGapOrdering
{
    public static List<SkillGapResultDto> Sort(IEnumerable<SkillGapResultDto> items)
    {
        return items
            .OrderBy(DiscussionPriority)
            .ThenBy(RequirementKindRank)
            .ThenBy(item => item.SkillName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static int DiscussionPriority(SkillGapResultDto item)
    {
        var isOpenGap = IsOpenGap(item.Status);
        var isCritical = string.Equals(item.RequirementKind, RequirementKind.Critical, StringComparison.OrdinalIgnoreCase);

        if (isCritical && isOpenGap) return 0;
        if (isOpenGap) return 1;
        return 2;
    }

    private static int RequirementKindRank(SkillGapResultDto item)
    {
        if (string.Equals(item.RequirementKind, RequirementKind.Critical, StringComparison.OrdinalIgnoreCase))
            return 0;
        if (string.Equals(item.RequirementKind, RequirementKind.Required, StringComparison.OrdinalIgnoreCase))
            return 1;
        if (string.Equals(item.RequirementKind, RequirementKind.Desired, StringComparison.OrdinalIgnoreCase))
            return 2;
        return 3;
    }

    private static bool IsOpenGap(string? status) =>
        string.Equals(status, SkillGapCalculator.StatusGap, StringComparison.OrdinalIgnoreCase)
        || string.Equals(status, SkillGapCalculator.StatusMissing, StringComparison.OrdinalIgnoreCase);
}
