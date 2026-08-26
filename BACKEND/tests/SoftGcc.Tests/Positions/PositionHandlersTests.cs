using Moq;
using SoftGcc.Application.Positions.Commands.CreatePosition;
using SoftGcc.Application.Positions.Queries.GetPositionById;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Application.SkillReferential.Dtos;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using Xunit;

namespace SoftGcc.Tests.Positions;

public class PositionHandlersTests
{
    [Fact]
    public async Task GetPositionById_WhenMissing_ReturnsNull()
    {
        var repository = new Mock<IGenericRepository<Position>>();
        repository.Setup(r => r.GetById(42)).ReturnsAsync((Position?)null);

        var skillReferential = new Mock<ISkillReferentialService>();
        var handler = new GetPositionByIdQueryHandler(repository.Object, skillReferential.Object);
        var result = await handler.Handle(new GetPositionByIdQuery(42), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetPositionById_ReturnsPositionWithSkillMatrix()
    {
        var repository = new Mock<IGenericRepository<Position>>();
        repository.Setup(r => r.GetById(7)).ReturnsAsync(new Position
        {
            PositionId = 7,
            PositionName = "Développeur",
            DepartmentId = 2
        });

        var matrix = new List<PositionSkillItemDto>
        {
            new()
            {
                SkillPositionId = 1,
                SkillId = 10,
                SkillName = "C#",
                SkillCode = "CSHARP",
                ExpectedLevel = 3,
                RequirementKind = "Critical",
                Weight = 1.5m,
                State = 1
            }
        };
        var skillReferential = new Mock<ISkillReferentialService>();
        skillReferential
            .Setup(s => s.GetPositionSkillsAsync(7, It.IsAny<CancellationToken>()))
            .ReturnsAsync(matrix);

        var handler = new GetPositionByIdQueryHandler(repository.Object, skillReferential.Object);
        var result = await handler.Handle(new GetPositionByIdQuery(7), CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Développeur", result!.PositionName);
        var skill = Assert.Single(result.Skills);
        Assert.Equal(3, skill.ExpectedLevel);
        Assert.Equal("Critical", skill.RequirementKind);
        Assert.Equal(1.5m, skill.Weight);
        skillReferential.Verify(
            s => s.GetPositionSkillsAsync(7, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreatePosition_AddsEntity()
    {
        var repository = new Mock<IGenericRepository<Position>>();
        var position = new Position { PositionName = "Analyste" };
        repository.Setup(r => r.Add(position)).Returns(Task.CompletedTask);

        var handler = new CreatePositionCommandHandler(repository.Object);
        var result = await handler.Handle(new CreatePositionCommand(position), CancellationToken.None);

        Assert.Same(position, result);
        repository.Verify(r => r.Add(position), Times.Once);
    }
}
