using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.retirement;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.retirement
{
	public class CiviliteService
	{
		private readonly ICrudRepository<Civilite> _repository;

		public CiviliteService(ICrudRepository<Civilite> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Civilite>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Civilite> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Civilite civilite)
		{
			await _repository.Add(civilite);
		}

		public async Task Update(Civilite civilite)
		{
			await _repository.Update(civilite);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
