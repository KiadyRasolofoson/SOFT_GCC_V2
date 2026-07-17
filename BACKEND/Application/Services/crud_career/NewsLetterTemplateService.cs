using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Application.Services.crud_career
{
	public class NewsLetterTemplateService : INewsLetterTemplateService
	{
		private readonly IGenericRepository<NewsLetterTemplate> _repository;

		public NewsLetterTemplateService(IGenericRepository<NewsLetterTemplate> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<NewsLetterTemplate>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<NewsLetterTemplate?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(NewsLetterTemplate newsLetterTemplate)
		{
			await _repository.Add(newsLetterTemplate);
		}

		public async Task Update(NewsLetterTemplate newsLetterTemplate)
		{
			await _repository.Update(newsLetterTemplate);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
