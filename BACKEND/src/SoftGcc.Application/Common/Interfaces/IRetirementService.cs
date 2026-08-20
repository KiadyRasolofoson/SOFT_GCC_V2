using SoftGcc.Domain.Entities.retirement;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IRetirementService : ICrudService<RetirementParameter>
    {
        Task<object?> GetRetirement(int page, int pageSize);
        Task<object?> GetRetirementFilter(string? keyWord, int page, int pageSize);
        Task<List<VRetirement>> GetRetirementList();
        Task<(List<VRetirement> Data, int TotalCount)> GetRetirementFilter(
            string? keyWord = null,
            string? civiliteId = null,
            string? departmentId = null,
            string? positionId = null,
            string? age = null,
            string? year = null,
            int page = 1,
            int pageSize = 10);
    }
}
