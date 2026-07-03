using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class AssignmentTypeService
	{
		private readonly ICrudRepository<AssignmentType> _repository;

		public AssignmentTypeService(ICrudRepository<AssignmentType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<AssignmentType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<AssignmentType> GetById(int id)
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
