using soft_carriere_competence.Core.Entities.history;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    public interface IHistoryService
    {
        Task<object> GetAllHistory();
        Task Add(ActivityLog activityLog);
        Task Delete(int id);
    }
}
