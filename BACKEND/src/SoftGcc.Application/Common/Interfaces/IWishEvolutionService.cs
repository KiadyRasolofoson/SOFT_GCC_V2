using SoftGcc.Domain.Entities.wish_evolution;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IWishEvolutionService : ICrudService<WishEvolutionCareer>
    {
        Task<object?> GetWishEvolution(int page, int pageSize, string? keyWord);
        Task<List<VWishEvolution>> GetEmployeeWishEvolution(int idEmployee);
        Task<List<WishEvolutionCareer>> GetWishesByEmployeeAsync(int employeeId);
        Task<List<VWishEvolution>> GetWishEvolutionById(int idWishEvolution);
        Task<List<PcdSuggestionPosition>> GetSuggestionPosition(int idEmployee);
        Task<object> GetAllWishEvolution(int pageNumber = 1, int pageSize = 10);
        Task<List<VStatWishEvolution>> GetStatWishEvolutionByMonthInYear(int year);
        Task<(List<VWishEvolution> Data, int TotalCount)> GetWishEvolutionFilter(
            string? keyWord = null,
            string? dateRequestMin = null,
            string? dateRequestMax = null,
            string? wishTypeId = null,
            string? positionId = null,
            string? priority = null,
            string? state = null,
            int page = 1,
            int pageSize = 10);
        Task<List<VSkillPosition>> GetSkillPosition(int idPosition);
        Task<bool> UpdateState(int state, int wishEvolutionCareerId);
    }
}
