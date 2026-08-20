using MediatR;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Commands.CreatePosition;

public sealed class CreatePositionCommandHandler : IRequestHandler<CreatePositionCommand, Position>
{
    private readonly IGenericRepository<Position> _repository;

    public CreatePositionCommandHandler(IGenericRepository<Position> repository)
    {
        _repository = repository;
    }

    public async Task<Position> Handle(CreatePositionCommand request, CancellationToken cancellationToken)
    {
        await _repository.Add(request.Position);
        return request.Position;
    }
}
