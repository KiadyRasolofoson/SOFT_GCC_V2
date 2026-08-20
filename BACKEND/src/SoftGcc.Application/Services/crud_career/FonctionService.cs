using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class FonctionService : IFonctionService
	{
		private readonly IGenericRepository<Fonction> _repository;

		public FonctionService(IGenericRepository<Fonction> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<Fonction>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<Fonction?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(Fonction fonction)
		{
			await _repository.Add(fonction);
		}

		public async Task Update(Fonction fonction)
		{
			await _repository.Update(fonction);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
