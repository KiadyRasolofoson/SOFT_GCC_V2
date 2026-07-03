using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class LegalClassService
	{
		private readonly ICrudRepository<LegalClass> _repository;

		public LegalClassService(ICrudRepository<LegalClass> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<LegalClass>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<LegalClass> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(LegalClass legalClass)
		{
			await _repository.Add(legalClass);
		}

		public async Task Update(LegalClass legalClass)
		{
			await _repository.Update(legalClass);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
