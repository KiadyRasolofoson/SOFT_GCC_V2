using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.retirement
{
	public class RetirementService : IRetirementService
	{
		private readonly IGenericRepository<RetirementParameter> _repository;
		private readonly IRetirementDataService _dataService;

		public RetirementService(IGenericRepository<RetirementParameter> repository, IRetirementDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<RetirementParameter>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<RetirementParameter> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(RetirementParameter entity)
		{
			await _repository.Add(entity);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task Update(RetirementParameter echelon)
		{
			await _repository.Update(echelon);
		}

		public async Task<object?> GetRetirement(int page, int pageSize)
		{
			var data = await _dataService.GetRetirementList();
			return data;
		}

		public async Task<object?> GetRetirementFilter(string? keyWord, int page, int pageSize)
		{
			return await _dataService.GetRetirementFilter(keyWord, null, null, null, null, null, page, pageSize);
		}

		public async Task<List<VRetirement>> GetRetirementList()
		{
			return await _dataService.GetRetirementList();
		}

		public async Task<(List<VRetirement> Data, int TotalCount)> GetRetirementFilter(
		string? keyWord = null,
		string? civiliteId = null,
		string? departmentId = null,
		string? positionId = null,
		string? age = null,
		string? year = null,
		int page = 1,
		int pageSize = 10)
		{
			return await _dataService.GetRetirementFilter(keyWord, civiliteId, departmentId, positionId, age, year, page, pageSize);
		}
	}
}
