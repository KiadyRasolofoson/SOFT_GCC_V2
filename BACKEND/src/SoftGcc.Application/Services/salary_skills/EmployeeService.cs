using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.salary_skills
{
	public class EmployeeService : IEmployeeService
	{
		private readonly IGenericRepository<Employee> _repository;
		private readonly ISalarySkillDataService _dataService;

		public EmployeeService(IGenericRepository<Employee> repository, ISalarySkillDataService dataService)
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

		public async Task<Employee?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Employee employee, byte[]? photo)
		{
			var registrationNumber = employee.RegistrationNumber?.Trim();
			if (string.IsNullOrWhiteSpace(registrationNumber))
			{
				throw new ArgumentException("Le numéro de matricule est requis.", nameof(employee));
			}

			employee.RegistrationNumber = registrationNumber;

			var existingEmployee = await _repository.GetFirstOrDefaultAsync(e => e.RegistrationNumber == registrationNumber);
			if (existingEmployee != null)
			{
				throw new InvalidOperationException($"Le matricule {registrationNumber} existe déjà.");
			}

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
