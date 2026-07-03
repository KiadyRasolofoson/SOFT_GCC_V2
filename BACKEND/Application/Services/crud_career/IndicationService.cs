using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class IndicationService
	{
		private readonly ICrudRepository<Indication> _repository;

		public IndicationService(ICrudRepository<Indication> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Indication>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Indication> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Indication indication)
		{
			await _repository.Add(indication);
		}

		public async Task Update(Indication indication)
		{
			await _repository.Update(indication);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
