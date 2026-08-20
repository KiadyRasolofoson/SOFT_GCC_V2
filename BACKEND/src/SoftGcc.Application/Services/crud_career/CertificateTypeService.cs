using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.crud_career
{
	public class CertificateTypeService : ICertificateTypeService
	{
		private readonly IGenericRepository<CertificateType> _repository;

		public CertificateTypeService(IGenericRepository<CertificateType> repository)
		{
			_repository = repository;
		}

		public async Task<IEnumerable<CertificateType>> GetAll()
		{
			return await _repository.GetAll();
		}

		public async Task<CertificateType?> GetById(int id)
		{
			return await _repository.GetById(id);
		}

		public async Task Add(CertificateType certificateType)
		{
			await _repository.Add(certificateType);
		}

		public async Task Update(CertificateType certificateType)
		{
			await _repository.Update(certificateType);
		}

		public async Task Delete(int id)
		{
			await _repository.Delete(id);
		}
	}
}
