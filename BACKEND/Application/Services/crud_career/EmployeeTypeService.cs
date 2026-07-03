using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class EmployeeTypeService
	{
		private readonly ICrudRepository<EmployeeType> _repository;

		public EmployeeTypeService(ICrudRepository<EmployeeType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<EmployeeType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<EmployeeType> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(EmployeeType employeeType)
		{
			await _repository.Add(employeeType);
		}

		public async Task Update(EmployeeType employeeType)
		{
			await _repository.Update(employeeType);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
