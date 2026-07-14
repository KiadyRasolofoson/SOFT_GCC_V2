using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class DegreeService
	{
		private readonly IGenericRepository<Degree> _repository;

		public DegreeService(IGenericRepository<Degree> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Degree>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Degree> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Degree degree)
		{
			await _repository.Add(degree);
		}

		public async Task Update(Degree degree)
		{
			await _repository.Update(degree);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
