using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class SchoolService
	{
		private readonly ICrudRepository<School> _repository;

		public SchoolService(ICrudRepository<School> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<School>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<School> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(School school)
		{
			await _repository.Add(school);
		}

		public async Task Update(School school)
		{
			await _repository.Update(school);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
