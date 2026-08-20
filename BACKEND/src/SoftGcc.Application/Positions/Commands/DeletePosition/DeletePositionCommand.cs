using MediatR;

namespace SoftGcc.Application.Positions.Commands.DeletePosition;

public sealed record DeletePositionCommand(int Id) : IRequest;
