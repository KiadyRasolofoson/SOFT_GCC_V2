using Moq;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Interfaces.Data;
using Xunit;

namespace SoftGcc.Tests.SkillReferential;

public class EvaluationCompetenceServiceTests
{
    [Fact]
    public async Task UpdateEmployeeSkillsAfterEvaluation_DoesNotWritePercentOnEmployeeSkill()
    {
        var data = new Mock<IEvaluationDataService>(MockBehavior.Strict);
        var service = new EvaluationCompetenceService(data.Object);

        await service.UpdateEmployeeSkillsAfterEvaluation(42);

        data.Verify(
            d => d.ExecuteNonQueryAsync(It.Is<string>(sql => sql.Contains("Employee_skill")), It.IsAny<object[]>()),
            Times.Never);
        data.VerifyNoOtherCalls();
    }

    [Fact]
    public void SourceDoesNotContainLegacyPercentMultiplier()
    {
        var path = Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..",
            "src", "SoftGcc.Application", "Services", "Evaluations", "EvaluationCompetenceService.cs");
        var source = File.ReadAllText(Path.GetFullPath(path));
        Assert.DoesNotContain("* 20", source);
        Assert.DoesNotContain("Level = @p0", source);
    }
}
