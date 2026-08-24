using MediatR;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Commands.UpdatePosition;

public sealed class UpdatePositionCommandHandler : IRequestHandler<UpdatePositionCommand>
{
    private readonly IGenericRepository<Position> _repository;

    public UpdatePositionCommandHandler(IGenericRepository<Position> repository)
    {
        _repository = repository;
    }

    public Task Handle(UpdatePositionCommand request, CancellationToken cancellationToken)
        => _repository.Update(request.Position);
}
