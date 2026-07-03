using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.wish_evolution;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.wish_evolution
{
	public class WishTypeService
	{
		private readonly ICrudRepository<WishType> _repository;

		public WishTypeService(ICrudRepository<WishType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<WishType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<WishType> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(WishType wishType)
		{
			await _repository.Add(wishType);
		}

		public async Task Update(WishType wishType)
		{
			await _repository.Update(wishType);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
