namespace SoftGcc.Domain.SkillReferential;

public static class SkillCategory
{
    public const string Technical = "Technical";
    public const string Behavioral = "Behavioral";
    public const string Managerial = "Managerial";
    public const string Transversal = "Transversal";

    public static readonly IReadOnlyList<string> All =
    [
        Technical,
        Behavioral,
        Managerial,
        Transversal
    ];

    public static bool IsValid(string? value) =>
        All.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase));
}
