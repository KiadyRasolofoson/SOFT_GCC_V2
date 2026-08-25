using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class LegalClassService : ILegalClassService
	{
		private readonly IGenericRepository<LegalClass> _repository;

		public LegalClassService(IGenericRepository<LegalClass> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<LegalClass>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<IEnumerable<LegalClass>> GetByProfessionalCategory(int? professionalCategoryId)
		{
			var legalsClass = await _repository.GetAll();
			return professionalCategoryId.HasValue
				? legalsClass.Where(l => l.ProfessionalCategoryId == professionalCategoryId.Value)
				: legalsClass;
		}

		public async Task<LegalClass?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(LegalClass legalClass)
		{
			await _repository.Add(legalClass);
		}

		public async Task Update(LegalClass legalClass)
		{
			await _repository.Update(legalClass);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
