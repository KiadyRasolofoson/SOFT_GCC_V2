using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeEducationService : IEmployeeEducationService
	{
		private readonly IGenericRepository<EmployeeEducation> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeEducationService(IGenericRepository<EmployeeEducation> repository, ISalarySkillDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<EmployeeEducation>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeEducation?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeEducation education)
		{
			await _repository.Add(education);
		}

		public async Task Update(EmployeeEducation education)
		{
			await _repository.Update(education);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task<List<VEmployeeEducation>> GetEmployeeEducations(int idEmployee)
		{
			return await _dataService.GetEmployeeEducations(idEmployee);
		}

        public async Task<VEmployeeEducation?> GetEmployeeEducationById(int idEmployeeEducation)
        {
            return await _dataService.GetEmployeeEducationById(idEmployeeEducation);
        }
    }
}
