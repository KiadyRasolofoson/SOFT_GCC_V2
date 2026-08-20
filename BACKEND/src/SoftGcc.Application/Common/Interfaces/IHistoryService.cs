using SoftGcc.Domain.Entities.history;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IHistoryService
    {
        Task<object> GetAllHistory();
        Task Add(ActivityLog activityLog);
        Task Delete(int id);
    }
}
