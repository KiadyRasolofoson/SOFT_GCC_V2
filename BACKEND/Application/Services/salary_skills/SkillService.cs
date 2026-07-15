using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class SkillService : ISkillService
	{
		private readonly IGenericRepository<Skill> _repository;

		public SkillService(IGenericRepository<Skill> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Skill>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Skill> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Skill skill)
		{
			await _repository.Add(skill);
		}

		public async Task Update(Skill skill)
		{
			await _repository.Update(skill);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
