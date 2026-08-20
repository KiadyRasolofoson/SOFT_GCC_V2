using soft_carriere_competence.Core.Entities.retirement;

namespace soft_carriere_competence.Core.Interface.DataService
{
    public interface IRetirementDataService
    {
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
