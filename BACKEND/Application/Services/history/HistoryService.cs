using soft_carriere_competence.Core.Entities.history;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.history
{
	public class HistoryService
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
