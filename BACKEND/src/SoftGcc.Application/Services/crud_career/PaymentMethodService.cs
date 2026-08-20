using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class PaymentMethodService : IPaymentMethodService
	{
		private readonly IGenericRepository<PaymentMethod> _repository;

		public PaymentMethodService(IGenericRepository<PaymentMethod> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<PaymentMethod>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<PaymentMethod?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(PaymentMethod paymentMethod)
		{
			await _repository.Add(paymentMethod);
		}

		public async Task Update(PaymentMethod paymentMethod)
		{
			await _repository.Update(paymentMethod);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
