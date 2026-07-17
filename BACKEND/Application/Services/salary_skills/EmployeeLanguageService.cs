using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeLanguageService : IEmployeeLanguageService
	{
		private readonly IGenericRepository<EmployeeLanguage> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeLanguageService(IGenericRepository<EmployeeLanguage> repository, ISalarySkillDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<EmployeeLanguage>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeLanguage?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeLanguage employeeLanguage)
		{
			await _repository.Add(employeeLanguage);
		}

		public async Task Update(EmployeeLanguage employeeLanguage)
		{
			await _repository.Update(employeeLanguage);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee)
		{
			return await _dataService.GetEmployeeLanguages(idEmployee);
		}

        public async Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id)
        {
            return await _dataService.GetEmployeeLanguageById(id);
        }
    }
}
