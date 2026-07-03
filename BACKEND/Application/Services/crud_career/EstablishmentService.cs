using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class EstablishmentService
	{
		private readonly ICrudRepository<Establishment> _repository;

		public EstablishmentService(ICrudRepository<Establishment> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Establishment>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Establishment> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Establishment establishment)
		{
			await _repository.Add(establishment);
		}

		public async Task Update(Establishment establishment)
		{
			await _repository.Update(establishment);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
