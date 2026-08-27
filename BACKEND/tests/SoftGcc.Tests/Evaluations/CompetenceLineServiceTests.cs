using Moq;
using SoftGcc.Application.Services.Evaluations;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Entities.salary_skills;
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

    [Fact]
    public async Task EnsureForPositionSkillAsync_WhenMatrixActiveAndNoLine_CreatesLine()
    {
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetActiveSkillPositionAsync(4, 9)).ReturnsAsync(new SkillPosition
        {
            SkillPositionId = 21,
            PositionId = 4,
            SkillId = 9,
            State = 1,
            Skill = new Skill { SkillId = 9, Name = "Java" }
        });
        data.Setup(d => d.FindCompetenceLineBySkillPositionAsync(21)).ReturnsAsync((CompetenceLine?)null);

        CompetenceLine? created = null;
        data.Setup(d => d.CreateCompetenceLineAsync(It.IsAny<CompetenceLine>()))
            .Callback<CompetenceLine>(line => created = line)
            .Returns(Task.CompletedTask);

        var service = new CompetenceLineService(data.Object);
        var result = await service.EnsureForPositionSkillAsync(4, 9);

        Assert.NotNull(result);
        Assert.NotNull(created);
        Assert.Equal(21, created!.SkillPositionId);
        Assert.Equal(1, created.State);
        Assert.Equal("Java", created.Description);
        data.Verify(d => d.CreateCompetenceLineAsync(It.IsAny<CompetenceLine>()), Times.Once);
    }

    [Fact]
    public async Task EnsureForPositionSkillAsync_WhenMatrixMissing_ReturnsNull()
    {
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetActiveSkillPositionAsync(4, 9)).ReturnsAsync((SkillPosition?)null);

        var service = new CompetenceLineService(data.Object);
        var result = await service.EnsureForPositionSkillAsync(4, 9);

        Assert.Null(result);
        data.Verify(d => d.CreateCompetenceLineAsync(It.IsAny<CompetenceLine>()), Times.Never);
    }

    [Fact]
    public async Task EnsureForPositionSkillAsync_WhenExistingLineInactive_ReactivatesIt()
    {
        var existing = new CompetenceLine { CompetenceLineId = 5, SkillPositionId = 21, State = 0 };
        var data = new Mock<IEvaluationDataService>();
        data.Setup(d => d.GetActiveSkillPositionAsync(4, 9)).ReturnsAsync(new SkillPosition
        {
            SkillPositionId = 21,
            PositionId = 4,
            SkillId = 9,
            State = 1
        });
        data.Setup(d => d.FindCompetenceLineBySkillPositionAsync(21)).ReturnsAsync(existing);

        var service = new CompetenceLineService(data.Object);
        var result = await service.EnsureForPositionSkillAsync(4, 9);

        Assert.Same(existing, result);
        Assert.Equal(1, existing.State);
        data.Verify(d => d.UpdateCompetenceLineAsync(existing), Times.Once);
        data.Verify(d => d.CreateCompetenceLineAsync(It.IsAny<CompetenceLine>()), Times.Never);
    }
}
