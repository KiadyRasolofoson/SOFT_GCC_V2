using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class EchelonService
	{
		private readonly ICrudRepository<Echelon> _repository;

		public EchelonService(ICrudRepository<Echelon> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Echelon>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Echelon> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Echelon echelon)
		{
			await _repository.Add(echelon);
		}

		public async Task Update(Echelon echelon)
		{
			await _repository.Update(echelon);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
