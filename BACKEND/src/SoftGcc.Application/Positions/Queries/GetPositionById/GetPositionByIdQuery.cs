using MediatR;
using SoftGcc.Application.Positions.Dtos;

namespace SoftGcc.Application.Positions.Queries.GetPositionById;

public sealed record GetPositionByIdQuery(int Id) : IRequest<PositionDetailDto?>;
