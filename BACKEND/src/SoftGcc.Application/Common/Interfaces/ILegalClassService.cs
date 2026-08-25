using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface ILegalClassService : ICrudService<LegalClass>
    {
        Task<IEnumerable<LegalClass>> GetByProfessionalCategory(int? professionalCategoryId);
    }
}
