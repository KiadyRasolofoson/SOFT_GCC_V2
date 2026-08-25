using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class IndicationService : IIndicationService
	{
		private readonly IGenericRepository<Indication> _repository;

		public IndicationService(IGenericRepository<Indication> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Indication>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<IEnumerable<Indication>> GetByLegalClass(int? legalClassId)
		{
			var indications = await _repository.GetAll();
			return legalClassId.HasValue
				? indications.Where(i => i.LegalClassId == legalClassId.Value)
				: indications;
		}

		public async Task<Indication?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Indication indication)
		{
			await _repository.Add(indication);
		}

		public async Task Update(Indication indication)
		{
			await _repository.Update(indication);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
