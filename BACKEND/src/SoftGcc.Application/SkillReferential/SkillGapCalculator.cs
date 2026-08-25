using SoftGcc.Domain.SkillReferential;

namespace SoftGcc.Application.SkillReferential;

public sealed record SkillGapRow(
    int SkillId,
    string SkillName,
    int ExpectedRank,
    int? AcquiredRank,
    string RequirementKind,
    int? SkillVersionId,
    double Weight,
    int DomainId,
    string DomainName);

public sealed record SkillGapResult(
    int SkillId,
    string SkillName,
    int ExpectedRank,
    int? AcquiredRank,
    string RequirementKind,
    int? SkillVersionId,
    double Weight,
    bool Gap,
    string Status,
    int DomainId,
    string DomainName);

public static class SkillGapCalculator
{
    public const string StatusOk = "ok";
    public const string StatusGap = "gap";
    public const string StatusMissing = "missing";

    public static SkillGapResult Compute(SkillGapRow row)
    {
        var status = row.AcquiredRank is null
            ? StatusMissing
            : row.AcquiredRank.Value >= row.ExpectedRank
                ? StatusOk
                : StatusGap;

        var gap = status != StatusOk;
        return new SkillGapResult(
            row.SkillId,
            row.SkillName,
            row.ExpectedRank,
            row.AcquiredRank,
            row.RequirementKind,
            row.SkillVersionId,
            row.Weight,
            gap,
            status,
            row.DomainId,
            row.DomainName);
    }

    public static IReadOnlyList<SkillGapResult> ComputeAll(IEnumerable<SkillGapRow> rows) =>
        rows.Select(Compute).ToList();

    public static string BulletinClassification(int expectedRank, int? acquiredRank)
    {
        if (acquiredRank is null) return "non_acquise";
        if (acquiredRank.Value >= expectedRank) return "maitrisee";
        if (acquiredRank.Value == expectedRank - 1) return "en_cours";
        return "non_acquise";
    }

    public static string BulletinLabel(string classification) => classification switch
    {
        "maitrisee" => "Maîtrisée",
        "en_cours" => "En cours d'acquisition",
        _ => "Non acquise"
    };

    public static double CoveragePercent(IEnumerable<SkillGapRow> rows)
    {
        var relevant = rows.Where(row => RequirementKind.CountsForCoverage(row.RequirementKind)).ToList();
        if (relevant.Count == 0) return 0;
        var covered = relevant.Count(row => row.AcquiredRank >= row.ExpectedRank);
        return Math.Round(100.0 * covered / relevant.Count, 2);
    }
}
