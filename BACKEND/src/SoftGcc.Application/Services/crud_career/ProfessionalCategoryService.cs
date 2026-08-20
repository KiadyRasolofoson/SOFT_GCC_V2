using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class ProfessionalCategoryService : IProfessionalCategoryService
	{
		private readonly IGenericRepository<ProfessionalCategory> _repository;

		public ProfessionalCategoryService(IGenericRepository<ProfessionalCategory> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<ProfessionalCategory>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<ProfessionalCategory?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(ProfessionalCategory professionalCategory)
		{
			await _repository.Add(professionalCategory);
		}

		public async Task Update(ProfessionalCategory professionalCategory)
		{
			await _repository.Update(professionalCategory);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
