using MediatR;
using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Positions.Queries.GetPositions;

public sealed record GetPositionsQuery : IRequest<IEnumerable<Position>>;
