using MediatR;
using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Positions.Queries.GetPositionById;

public sealed record GetPositionByIdQuery(int Id) : IRequest<Position?>;
