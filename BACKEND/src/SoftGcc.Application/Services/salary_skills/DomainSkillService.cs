using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.salary_skills
{
	public class DomainSkillService : IDomainSkillService
	{
		private readonly IGenericRepository<DomainSkill> _repository;

		public DomainSkillService(IGenericRepository<DomainSkill> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<DomainSkill>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<DomainSkill?> GetById(int id)
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
