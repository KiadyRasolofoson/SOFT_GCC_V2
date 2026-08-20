using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeSkillService : IEmployeeSkillService
	{
		private readonly IGenericRepository<EmployeeSkill> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeSkillService(IGenericRepository<EmployeeSkill> repository, ISalarySkillDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<EmployeeSkill>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeSkill?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeSkill employeeSkill)
		{
			await _repository.Add(employeeSkill);
		}

		public async Task Update(EmployeeSkill employeeSkill)
		{
			await _repository.Update(employeeSkill);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task<List<VEmployeeSkill>> GetEmployeeSkills(int idEmployee)
		{
			return await _dataService.GetEmployeeSkills(idEmployee);
		}

		public async Task<object> GetAllSkills(int pageNumber = 1, int pageSize = 10)
		{
			return await _dataService.GetAllSkills(pageNumber, pageSize);
		}

		public async Task<object> GetAllSkillsFilter(string keyWord, int pageNumber = 1, int pageSize = 10)
		{
			return await _dataService.GetAllSkillsFilter(keyWord, pageNumber, pageSize);
		}

		public async Task<List<VSkills>> GetEmployeeDescription(int idEmployee)
		{
			return await _dataService.GetEmployeeDescription(idEmployee);
		}

		public async Task<List<VEmployeeSkill>> GetSkillLevel(int idEmployee, int state)
		{
			return await _dataService.GetSkillLevel(idEmployee, state);
		}

		public async Task<List<VStateNumber>> GetStateNumber(int idEmployee)
		{
			return await _dataService.GetStateNumber(idEmployee);
		}

		public async Task<string> IsSkillEmployeeExist(int idEmployee, int domainSkillId, int skillId)
		{
			return await _dataService.IsSkillEmployeeExist(idEmployee, domainSkillId, skillId);
		}

		public async Task<VEmployeeSkill?> GetEmployeeSkillById(int id)
		{
			return await _dataService.GetEmployeeSkillById(id);
		}
	}
}
