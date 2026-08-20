using MediatR;
using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Positions.Commands.CreatePosition;

public sealed record CreatePositionCommand(Position Position) : IRequest<Position>;
