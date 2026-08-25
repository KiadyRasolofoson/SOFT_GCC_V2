using SoftGcc.Api.Controllers.SkillReferential;
using SoftGcc.Application.Authorization;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class SkillReferentialPermissionAttributeTests
{
    [Fact]
    public void Publish_RequiresPublishPermissionOnly()
    {
        var method = typeof(SkillReferentialController).GetMethod(nameof(SkillReferentialController.Publish));
        Assert.NotNull(method);
        var attribute = method!.GetCustomAttributes(typeof(RequirePermissionAttribute), false)
            .Cast<RequirePermissionAttribute>()
            .Single();

        Assert.Equal("Permission:PUBLISH_SKILL_REFERENTIAL", attribute.Policy);
        Assert.DoesNotContain("VIEW_SKILL_SETTINGS", attribute.Policy);
    }

    [Fact]
    public void CreateDraft_DoesNotAllowViewOnly()
    {
        var method = typeof(SkillReferentialController).GetMethod(nameof(SkillReferentialController.CreateDraft));
        Assert.NotNull(method);
        var attribute = method!.GetCustomAttributes(typeof(RequirePermissionAttribute), false)
            .Cast<RequirePermissionAttribute>()
            .Single();

        Assert.DoesNotContain("VIEW_SKILL_SETTINGS", attribute.Policy);
        Assert.Contains("MANAGE_SKILL_SETTINGS", attribute.Policy);
    }

    [Fact]
    public void GetCatalog_AllowsView()
    {
        var method = typeof(SkillReferentialController).GetMethod(nameof(SkillReferentialController.GetCatalog));
        Assert.NotNull(method);
        var attribute = method!.GetCustomAttributes(typeof(RequirePermissionAttribute), false)
            .Cast<RequirePermissionAttribute>()
            .Single();

        Assert.Contains("VIEW_SKILL_SETTINGS", attribute.Policy);
    }

    [Fact]
    public void SuggestCode_AllowsView()
    {
        var method = typeof(SkillReferentialController).GetMethod(nameof(SkillReferentialController.SuggestCode));
        Assert.NotNull(method);
        var attribute = method!.GetCustomAttributes(typeof(RequirePermissionAttribute), false)
            .Cast<RequirePermissionAttribute>()
            .Single();

        Assert.Contains("VIEW_SKILL_SETTINGS", attribute.Policy);
    }
}
