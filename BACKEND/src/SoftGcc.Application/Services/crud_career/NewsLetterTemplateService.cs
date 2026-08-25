using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
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

		public async Task<IEnumerable<NewsLetterTemplate>> GetByEmployeeType(int? employeeTypeId)
		{
			var templates = await _repository.GetAll();
			return employeeTypeId.HasValue
				? templates.Where(t => t.EmployeeTypeId == employeeTypeId.Value)
				: templates;
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
