using SoftGcc.Domain.Entities.crud_career;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IIndicationService : ICrudService<Indication>
    {
        Task<IEnumerable<Indication>> GetByLegalClass(int? legalClassId);
    }
}
