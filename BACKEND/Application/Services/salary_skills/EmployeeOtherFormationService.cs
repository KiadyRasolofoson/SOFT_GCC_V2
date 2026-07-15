using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeOtherFormationService : IEmployeeOtherFormationService
	{
		private readonly IGenericRepository<EmployeeOtherFormation> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeOtherFormationService(IGenericRepository<EmployeeOtherFormation> repository, ISalarySkillDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<EmployeeOtherFormation>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeOtherFormation> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeOtherFormation employeeOtherFormation)
		{
			await _repository.Add(employeeOtherFormation);
		}

		public async Task Update(EmployeeOtherFormation employeeOtherFormation)
		{
			await _repository.Update(employeeOtherFormation);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task<List<VEmployeeOtherSkill>> GetEmployeeOtherSkills(int idEmployee)
		{
			return await _dataService.GetEmployeeOtherSkills(idEmployee);
		}

        public async Task<VEmployeeOtherSkill?> GetEmployeeOtherFormationById(int id)
        {
            return await _dataService.GetEmployeeOtherFormationById(id);
        }
    }
}
