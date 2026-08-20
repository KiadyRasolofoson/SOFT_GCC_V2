using SoftGcc.Domain.Entities.salary_skills;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.salary_skills
{
	public class LanguageService : ILanguageService
	{
		private readonly IGenericRepository<Language> _repository;

		public LanguageService(IGenericRepository<Language> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Language>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Language?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Language language)
		{
			await _repository.Add(language);
		}

		public async Task Update(Language language)
		{
			await _repository.Update(language);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
