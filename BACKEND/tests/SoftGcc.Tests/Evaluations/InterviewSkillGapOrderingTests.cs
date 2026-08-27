using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.Evaluations;

public class InterviewSkillGapOrderingTests
{
    [Fact]
    public void Sort_OrdersCriticalGap_ThenRequiredGap_ThenDesiredGap_ThenOk()
    {
        var items = new List<SkillGapResultDto>
        {
            Item("Ok skill", RequirementKind.Critical, SkillGapCalculator.StatusOk),
            Item("Desired gap", RequirementKind.Desired, SkillGapCalculator.StatusGap),
            Item("Required missing", RequirementKind.Required, SkillGapCalculator.StatusMissing),
            Item("Critical gap", RequirementKind.Critical, SkillGapCalculator.StatusGap),
            Item("Required gap", RequirementKind.Required, SkillGapCalculator.StatusGap),
        };

        var sorted = InterviewSkillGapOrdering.Sort(items);

        Assert.Equal(
            ["Critical gap", "Required gap", "Required missing", "Desired gap", "Ok skill"],
            sorted.Select(item => item.SkillName).ToList());
    }

    [Fact]
    public void Sort_CriticalMissing_Before_RequiredGap()
    {
        var items = new List<SkillGapResultDto>
        {
            Item("Required", RequirementKind.Required, SkillGapCalculator.StatusGap),
            Item("Critical missing", RequirementKind.Critical, SkillGapCalculator.StatusMissing),
        };

        var sorted = InterviewSkillGapOrdering.Sort(items);

        Assert.Equal("Critical missing", sorted[0].SkillName);
        Assert.Equal("Required", sorted[1].SkillName);
    }

    private static SkillGapResultDto Item(string name, string kind, string status) => new()
    {
        SkillId = name.GetHashCode(),
        SkillName = name,
        ExpectedRank = 3,
        AcquiredRank = status == SkillGapCalculator.StatusOk ? 3 : 1,
        RequirementKind = kind,
        Gap = status != SkillGapCalculator.StatusOk,
        Status = status,
        DomainId = 1,
        DomainName = "D",
    };
}
