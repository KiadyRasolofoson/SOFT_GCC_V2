using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class DomainSkillService
	{
		private readonly ICrudRepository<DomainSkill> _repository;

		public DomainSkillService(ICrudRepository<DomainSkill> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<DomainSkill>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<DomainSkill> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(DomainSkill domainSkill)
		{
			await _repository.Add(domainSkill);
		}

		public async Task Update(DomainSkill domainSkill)
		{
			await _repository.Update(domainSkill);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
