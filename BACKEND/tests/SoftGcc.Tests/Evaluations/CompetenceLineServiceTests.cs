using Moq;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Exceptions;
using SoftGcc.Domain.Interfaces.Data;
using Xunit;

namespace SoftGcc.Tests.Evaluations;

public class CompetenceLineServiceTests
{
    [Fact]
    public async Task Create_WhenSkillPositionMissing_ThrowsValidationException()
    {
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetSkillPositionByIdAsync(99)).ReturnsAsync((SkillPosition?)null);

        var service = new CompetenceLineService(data.Object);
        var line = new CompetenceLine { SkillPositionId = 99, Description = "Test" };

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(line));
    }

    [Fact]
    public async Task Create_WhenMatrixRowArchived_ThrowsValidationException()
    {
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetSkillPositionByIdAsync(5)).ReturnsAsync(new SkillPosition
        {
            SkillPositionId = 5,
            State = 0
        });

        var service = new CompetenceLineService(data.Object);
        var line = new CompetenceLine { SkillPositionId = 5, Description = "Test" };

        await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(line));
    }

    [Fact]
    public async Task Create_WhenMatrixRowActive_CreatesLine()
    {
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetSkillPositionByIdAsync(5)).ReturnsAsync(new SkillPosition
        {
            SkillPositionId = 5,
            State = 1
        });

        var service = new CompetenceLineService(data.Object);
        var line = new CompetenceLine { SkillPositionId = 5, Description = "Test" };

        var created = await service.CreateAsync(line);

        Assert.Equal(1, created.State);
        data.Verify(d => d.CreateCompetenceLineAsync(line), Times.Once);
    }
}
