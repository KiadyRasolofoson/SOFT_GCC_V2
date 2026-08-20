using MediatR;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Commands.DeletePosition;

public sealed class DeletePositionCommandHandler : IRequestHandler<DeletePositionCommand>
{
    private readonly IGenericRepository<Position> _repository;

    public DeletePositionCommandHandler(IGenericRepository<Position> repository)
    {
        _repository = repository;
    }

    public Task Handle(DeletePositionCommand request, CancellationToken cancellationToken)
        => _repository.Delete(request.Id);
}
