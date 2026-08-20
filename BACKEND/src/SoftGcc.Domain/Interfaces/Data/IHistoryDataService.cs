namespace SoftGcc.Domain.Interfaces.Data
{
    public interface IHistoryDataService
    {
        Task<object> GetAllHistory();
    }
}
