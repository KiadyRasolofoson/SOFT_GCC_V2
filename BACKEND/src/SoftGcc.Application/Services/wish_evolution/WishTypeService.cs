using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.wish_evolution;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.wish_evolution
{
	public class WishTypeService : IWishTypeService
	{
		private readonly IGenericRepository<WishType> _repository;

		public WishTypeService(IGenericRepository<WishType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<WishType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<WishType?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(WishType wishType)
		{
			await _repository.Add(wishType);
		}

		public async Task Update(WishType wishType)
		{
			await _repository.Update(wishType);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
