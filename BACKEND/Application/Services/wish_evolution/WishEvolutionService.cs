using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.wish_evolution
{
	public class WishEvolutionService : IWishEvolutionService
	{
		private readonly IGenericRepository<WishEvolutionCareer> _repository;
		private readonly IWishEvolutionDataService _dataService;

		public WishEvolutionService(IGenericRepository<WishEvolutionCareer> repository, IWishEvolutionDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<WishEvolutionCareer>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<WishEvolutionCareer?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Update(WishEvolutionCareer wishEvolution)
		{
			await _repository.Update(wishEvolution);
		}

		public async Task Add(WishEvolutionCareer wishEvolution)
		{
			await _repository.Add(wishEvolution);
		}

		public async Task<List<PcdSuggestionPosition>> GetSuggestionPosition(int idEmployee)
		{
			return await _dataService.GetSuggestionPosition(idEmployee);
		}

		public async Task<object?> GetWishEvolution(int page, int pageSize, string? keyWord)
		{
			return await _dataService.GetAllWishEvolution(page, pageSize);
		}

		public async Task<List<VWishEvolution>> GetEmployeeWishEvolution(int idEmployee)
		{
			return await _dataService.GetWishEvolutionById(idEmployee);
		}

		public async Task<List<WishEvolutionCareer>> GetWishesByEmployeeAsync(int employeeId)
		{
			var wishes = await _repository.GetAll();
			return wishes.Where(w => w.EmployeeId == employeeId).ToList();
		}

		public async Task<object> GetAllWishEvolution(int pageNumber = 1, int pageSize = 10)
		{
			return await _dataService.GetAllWishEvolution(pageNumber, pageSize);
		}

		public async Task<List<VStatWishEvolution>> GetStatWishEvolutionByMonthInYear(int year)
		{
			return await _dataService.GetStatWishEvolutionByMonthInYear(year);
		}

		public async Task<List<VWishEvolution>> GetWishEvolutionById(int idWishEvolution)
		{
			return await _dataService.GetWishEvolutionById(idWishEvolution);
		}

		public async Task<List<VSkillPosition>> GetSkillPosition(int idPosition)
		{
			return await _dataService.GetSkillPosition(idPosition);
		}

		public async Task<(List<VWishEvolution> Data, int TotalCount)> GetWishEvolutionFilter(
		string? keyWord = null,
		string? dateRequestMin = null,
		string? dateRequestMax = null,
		string? wishTypeId = null,
		string? positionId = null,
		string? priority = null,
		string? state = null,
		int page = 1,
		int pageSize = 10)
		{
			return await _dataService.GetWishEvolutionFilter(keyWord, dateRequestMin, dateRequestMax, wishTypeId, positionId, priority, state, page, pageSize);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task<bool> UpdateState(int state, int wishEvolutionCareerId)
		{
			return await _dataService.UpdateState(state, wishEvolutionCareerId);
		}
	}
}
