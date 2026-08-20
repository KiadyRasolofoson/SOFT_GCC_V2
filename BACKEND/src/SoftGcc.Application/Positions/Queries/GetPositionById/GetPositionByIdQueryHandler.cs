using MediatR;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Queries.GetPositionById;

public sealed class GetPositionByIdQueryHandler : IRequestHandler<GetPositionByIdQuery, Position?>
{
    private readonly IGenericRepository<Position> _repository;

    public GetPositionByIdQueryHandler(IGenericRepository<Position> repository)
    {
        _repository = repository;
    }

    public Task<Position?> Handle(GetPositionByIdQuery request, CancellationToken cancellationToken)
        => _repository.GetById(request.Id);
}
