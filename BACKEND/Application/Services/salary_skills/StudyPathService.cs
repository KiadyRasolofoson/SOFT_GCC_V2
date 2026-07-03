using soft_carriere_competence.Core.Entities.salary_skills;
using soft_carriere_competence.Core.Interface;

namespace soft_carriere_competence.Application.Services.salary_skills
{
	public class StudyPathService
	{
		private readonly ICrudRepository<StudyPath> _repository;

		public StudyPathService(ICrudRepository<StudyPath> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<StudyPath>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<StudyPath> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(StudyPath studyPath)
		{
			await _repository.Add(studyPath);
		}

		public async Task Update(StudyPath studyPath)
		{
			await _repository.Update(studyPath);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
