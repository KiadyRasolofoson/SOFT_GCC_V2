using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class SocioCategoryProfessionalService
	{
		private readonly ICrudRepository<SocioCategoryProfessional> _repository;

		public SocioCategoryProfessionalService(ICrudRepository<SocioCategoryProfessional> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<SocioCategoryProfessional>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<SocioCategoryProfessional> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(SocioCategoryProfessional socioCategoryProfessional)
		{
			await _repository.Add(socioCategoryProfessional);
		}

		public async Task Update(SocioCategoryProfessional socioCategoryProfessional)
		{
			await _repository.Update(socioCategoryProfessional);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
