using MediatR;
using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Positions.Commands.UpdatePosition;

public sealed record UpdatePositionCommand(int Id, Position Position) : IRequest;
