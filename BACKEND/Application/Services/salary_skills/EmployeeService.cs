using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class EmployeeService
	{
		private readonly ICrudRepository<Employee> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeService(ICrudRepository<Employee> repository, ISalarySkillDataService dataService)
		{
			_repository = repository;
			_dataService = dataService;
		}

		public async Task<IEnumerable<VEmployee>> GetAll()
		{
			return await _dataService.GetAllEmployees();
		}

		public async Task<(List<VEmployee> Data, int TotalCount)> GetEmployeeFilter(
		string? keyWord = null,
		string? departmentId = null,
		string? hiringDate1 = null,
		string? hiringDate2 = null,
		int page = 1,
		int pageSize = 10)
		{
			return await _dataService.GetEmployeeFilter(keyWord, departmentId, hiringDate1, hiringDate2, page, pageSize);
		}

		public async Task<Employee> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Employee employee, byte[]? photo)
		{
			if (photo != null)
			{
				employee.Photo = photo;
			}
			await _repository.Add(employee);
		}

		public async Task Update(Employee employee)
		{
			await _repository.Update(employee);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}

		public async Task SaveImage(ImageEntity imageEntity)
		{
			await _dataService.SaveImage(imageEntity);
		}
	}
}
