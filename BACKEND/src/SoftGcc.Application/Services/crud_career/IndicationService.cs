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
