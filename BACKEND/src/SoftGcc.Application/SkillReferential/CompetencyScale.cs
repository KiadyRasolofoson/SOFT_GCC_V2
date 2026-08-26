using SoftGcc.Domain.Exceptions;

namespace SoftGcc.Application.SkillReferential;

public static class CompetencyScale
{
    public const int MinRank = 1;
    public const int MaxRank = 4;

    public const string Notion = "NOTION";
    public const string Application = "APPLICATION";
    public const string Maitrise = "MAITRISE";
    public const string Expertise = "EXPERTISE";

    public static readonly int[] Ranks = [1, 2, 3, 4];

    public static bool IsValid(int rank) => rank is >= MinRank and <= MaxRank;

    public static bool IsValid(int? rank) => rank is null || IsValid(rank.Value);

    public static void EnsureValid(int rank, string fieldName)
    {
        if (!IsValid(rank))
        {
            throw new ValidationException($"{fieldName} doit être un rang 1 à 4.");
        }
    }

    public static int FromLegacyPercent(double percent)
    {
        if (percent < 25) return 1;
        if (percent < 50) return 2;
        if (percent < 75) return 3;
        return 4;
    }

    public static int FromRequiredLevel(double? requiredLevel)
    {
        if (requiredLevel is null or <= 0) return 2;
        return FromLegacyPercent(requiredLevel.Value);
    }

    public static string Code(int rank) => rank switch
    {
        1 => Notion,
        2 => Application,
        3 => Maitrise,
        4 => Expertise,
        _ => throw new ValidationException("Rang de compétence invalide.")
    };

    public static string Label(int rank) => rank switch
    {
        1 => "Notions",
        2 => "Application",
        3 => "Maîtrise",
        4 => "Expert",
        _ => throw new ValidationException("Rang de compétence invalide.")
    };

    public static string DefaultDescriptorLabel(int rank) => Label(rank);

    public static string UiLevel(int rank) => rank switch
    {
        1 => "beginner",
        2 => "application",
        3 => "intermediate",
        4 => "expert",
        _ => "beginner"
    };

    /// <summary>
    /// Rang 1–4 si <paramref name="score"/> est un entier de l’échelle.
    /// Un OverallScore de campagne (ex. 4.2) n’est pas un rang.
    /// </summary>
    public static int? RankFromStoredScore(decimal score)
    {
        var rank = (int)decimal.Truncate(score);
        return score == rank && IsValid(rank) ? rank : null;
    }
}
