using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class SkillGapCalculatorTests
{
    [Fact]
    public void Compute_WhenAcquiredBelowExpected_IsGap()
    {
        var result = SkillGapCalculator.Compute(new SkillGapRow(1, "Oral", 3, 2, RequirementKind.Required, 10, 1, 1, "Com"));
        Assert.True(result.Gap);
        Assert.Equal(SkillGapCalculator.StatusGap, result.Status);
    }

    [Fact]
    public void Compute_WhenAcquiredMissing_IsMissing()
    {
        var result = SkillGapCalculator.Compute(new SkillGapRow(1, "Oral", 3, null, RequirementKind.Critical, null, 1, 1, "Com"));
        Assert.True(result.Gap);
        Assert.Equal(SkillGapCalculator.StatusMissing, result.Status);
    }

    [Fact]
    public void Compute_WhenAcquiredMeetsExpected_IsOk()
    {
        var result = SkillGapCalculator.Compute(new SkillGapRow(1, "Oral", 3, 4, RequirementKind.Required, 10, 1, 1, "Com"));
        Assert.False(result.Gap);
        Assert.Equal(SkillGapCalculator.StatusOk, result.Status);
    }

    [Fact]
    public void CoveragePercent_IgnoresDesiredAndCountsHoldersAtLevel()
    {
        var rows = new[]
        {
            new SkillGapRow(1, "A", 3, 3, RequirementKind.Critical, 1, 1, 1, "D"),
            new SkillGapRow(2, "B", 2, 1, RequirementKind.Required, 1, 1, 1, "D"),
            new SkillGapRow(3, "C", 4, 1, RequirementKind.Desired, 1, 1, 1, "D")
        };

        Assert.Equal(50, SkillGapCalculator.CoveragePercent(rows));
    }

    [Fact]
    public void BulletinClassification_UsesRankVersusExpected()
    {
        Assert.Equal("maitrisee", SkillGapCalculator.BulletinClassification(3, 3));
        Assert.Equal("en_cours", SkillGapCalculator.BulletinClassification(3, 2));
        Assert.Equal("non_acquise", SkillGapCalculator.BulletinClassification(3, 1));
        Assert.Equal("non_acquise", SkillGapCalculator.BulletinClassification(3, null));
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(24, 1)]
    [InlineData(25, 2)]
    [InlineData(49, 2)]
    [InlineData(50, 3)]
    [InlineData(74, 3)]
    [InlineData(75, 4)]
    [InlineData(100, 4)]
    public void FromLegacyPercent_UsesDocumentedBuckets(double percent, int rank)
    {
        Assert.Equal(rank, CompetencyScale.FromLegacyPercent(percent));
    }
}
