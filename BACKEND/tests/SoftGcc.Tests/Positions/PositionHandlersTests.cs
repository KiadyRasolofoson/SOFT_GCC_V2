using Moq;
using SoftGcc.Application.Positions.Commands.CreatePosition;
using SoftGcc.Application.Positions.Queries.GetPositionById;
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

        var handler = new GetPositionByIdQueryHandler(repository.Object);
        var result = await handler.Handle(new GetPositionByIdQuery(42), CancellationToken.None);

        Assert.Null(result);
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
