using SoftGcc.Domain.Entities.history;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.history
{
	public class HistoryService : IHistoryService
	{
		private readonly IGenericRepository<ActivityLog> _repository;
		private readonly IHistoryDataService _dataService;

		public HistoryService(IGenericRepository<ActivityLog> repository, IHistoryDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<object> GetAllHistory()
		{
			return await _dataService.GetAllHistory();
		}

		public async Task Add(ActivityLog activityLog)
		{
			await _repository.Add(activityLog);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
