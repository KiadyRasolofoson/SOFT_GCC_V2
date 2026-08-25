using MediatR;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Queries.GetPositions;

public sealed class GetPositionsQueryHandler : IRequestHandler<GetPositionsQuery, IEnumerable<Position>>
{
    private readonly IGenericRepository<Position> _repository;

    public GetPositionsQueryHandler(IGenericRepository<Position> repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<Position>> Handle(GetPositionsQuery request, CancellationToken cancellationToken)
    {
        var positions = await _repository.GetAll();
        return request.DepartmentId.HasValue
            ? positions.Where(p => p.DepartmentId == request.DepartmentId.Value)
            : positions;
    }
}
