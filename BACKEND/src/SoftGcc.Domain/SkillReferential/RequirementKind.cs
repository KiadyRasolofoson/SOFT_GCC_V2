namespace SoftGcc.Domain.SkillReferential;

public static class RequirementKind
{
    public const string Critical = "Critical";
    public const string Required = "Required";
    public const string Desired = "Desired";

    public static readonly IReadOnlyList<string> All = [Critical, Required, Desired];

    public static bool IsValid(string? value) =>
        All.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase));

    public static bool CountsForCoverage(string? value) =>
        string.Equals(value, Critical, StringComparison.OrdinalIgnoreCase)
        || string.Equals(value, Required, StringComparison.OrdinalIgnoreCase);
}
