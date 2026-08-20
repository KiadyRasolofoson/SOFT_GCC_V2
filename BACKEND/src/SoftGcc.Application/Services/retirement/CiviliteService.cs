using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.retirement;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.retirement
{
	public class CiviliteService : ICiviliteService
	{
		private readonly IGenericRepository<Civilite> _repository;

		public CiviliteService(IGenericRepository<Civilite> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Civilite>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Civilite?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Civilite civilite)
		{
			await _repository.Add(civilite);
		}

		public async Task Update(Civilite civilite)
		{
			await _repository.Update(civilite);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
