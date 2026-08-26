using MediatR;
using SoftGcc.Application.Positions.Dtos;
using SoftGcc.Application.SkillReferential;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;

namespace SoftGcc.Application.Positions.Queries.GetPositionById;

public sealed class GetPositionByIdQueryHandler : IRequestHandler<GetPositionByIdQuery, PositionDetailDto?>
{
    private readonly IGenericRepository<Position> _repository;
    private readonly ISkillReferentialService _skillReferential;

    public GetPositionByIdQueryHandler(
        IGenericRepository<Position> repository,
        ISkillReferentialService skillReferential)
    {
        _repository = repository;
        _skillReferential = skillReferential;
    }

    public async Task<PositionDetailDto?> Handle(GetPositionByIdQuery request, CancellationToken cancellationToken)
    {
        var position = await _repository.GetById(request.Id);
        if (position is null)
        {
            return null;
        }

        // La matrice est lue depuis Skill_position (source unique) via le service du référentiel.
        var skills = await _skillReferential.GetPositionSkillsAsync(request.Id, cancellationToken);

        return new PositionDetailDto
        {
            PositionId = position.PositionId,
            PositionName = position.PositionName,
            DepartmentId = position.DepartmentId,
            ProfessionalCategoryId = position.ProfessionalCategoryId,
            LegalClassId = position.LegalClassId,
            Skills = skills.ToList()
        };
    }
}
