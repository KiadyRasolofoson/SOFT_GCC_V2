using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class AssignmentTypeService : IAssignmentTypeService
	{
		private readonly IGenericRepository<AssignmentType> _repository;

		public AssignmentTypeService(IGenericRepository<AssignmentType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<AssignmentType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<AssignmentType?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(AssignmentType assignmentType)
		{
			await _repository.Add(assignmentType);
		}

		public async Task Update(AssignmentType assignmentType)
		{
			await _repository.Update(assignmentType);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
    }
}
