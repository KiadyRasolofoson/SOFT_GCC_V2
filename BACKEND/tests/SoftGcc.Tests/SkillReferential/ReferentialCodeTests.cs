using SoftGcc.Domain.SkillReferential;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class ReferentialCodeTests
{
    [Fact]
    public void Suggest_UsesNextSequentialRegardlessOfName()
    {
        var code = ReferentialCode.Suggest(
            ["SKILL-00061", "NET", "SKILL-00062"],
            ReferentialCode.SkillPrefix);

        Assert.Equal("SKILL-00063", code);
    }

    [Fact]
    public void Suggest_Domain_StartsAt00001WhenEmpty()
    {
        var code = ReferentialCode.Suggest(["UNC"], ReferentialCode.DomainPrefix);
        Assert.Equal("DOMAIN-00001", code);
    }

    [Fact]
    public void Suggest_Family_IgnoresNonNumericCodes()
    {
        var code = ReferentialCode.Suggest(["UNC-FAM", "FAM-00004"], ReferentialCode.FamilyPrefix);
        Assert.Equal("FAM-00005", code);
    }
}
