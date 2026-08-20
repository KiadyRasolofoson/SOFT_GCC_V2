using FluentValidation;

namespace SoftGcc.Application.Positions.Commands.CreatePosition;

public sealed class CreatePositionCommandValidator : AbstractValidator<CreatePositionCommand>
{
    public CreatePositionCommandValidator()
    {
        RuleFor(x => x.Position).NotNull();
    }
}
