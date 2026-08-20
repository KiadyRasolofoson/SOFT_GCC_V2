using soft_carriere_competence.Core.Entities.wish_evolution;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface IWishEvolutionDataService
    {
        Task<List<PcdSuggestionPosition>> GetSuggestionPosition(int idEmployee);
        Task<object> GetAllWishEvolution(int pageNumber = 1, int pageSize = 10);
        Task<List<VStatWishEvolution>> GetStatWishEvolutionByMonthInYear(int year);
        Task<List<VWishEvolution>> GetWishEvolutionById(int idWishEvolution);
        Task<List<VSkillPosition>> GetSkillPosition(int idPosition);
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
        Task<bool> UpdateState(int state, int wishEvolutionCareerId);
    }
}
