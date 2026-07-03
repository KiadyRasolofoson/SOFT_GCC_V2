using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class ProfessionalCategoryService
	{
		private readonly ICrudRepository<ProfessionalCategory> _repository;

		public ProfessionalCategoryService(ICrudRepository<ProfessionalCategory> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<ProfessionalCategory>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<ProfessionalCategory> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(ProfessionalCategory professionalCategory)
		{
			await _repository.Add(professionalCategory);
		}

		public async Task Update(ProfessionalCategory professionalCategory)
		{
			await _repository.Update(professionalCategory);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
