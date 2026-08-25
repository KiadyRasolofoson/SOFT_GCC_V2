namespace SoftGcc.Domain.SkillReferential;

public static class SkillLifecycle
{
    public const string Draft = "Draft";
    public const string Active = "Active";
    public const string Archived = "Archived";

    public static bool IsArchived(string? state) =>
        string.Equals(state, Archived, StringComparison.OrdinalIgnoreCase);

    public static bool IsActive(string? state) =>
        string.Equals(state, Active, StringComparison.OrdinalIgnoreCase);

    public static bool IsDraft(string? state) =>
        string.Equals(state, Draft, StringComparison.OrdinalIgnoreCase);
}
