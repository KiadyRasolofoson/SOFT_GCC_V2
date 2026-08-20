using SoftGcc.Application.Dtos.History;
using SoftGcc.Domain.Entities.career_plan;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Application.Services.career_plan
{
    public class CertificateHistoryService : ICertificateHistoryService
    {
        private readonly IGenericRepository<CertificateHistory> _repository;
        private readonly ICareerPlanDataService _dataService;

        public CertificateHistoryService(IGenericRepository<CertificateHistory> repository, ICareerPlanDataService dataService)
        {
            _repository = repository;
            _dataService = dataService;
        }

        public async Task<IEnumerable<CertificateHistory>> GetAll()
        {
            return await _repository.GetAll();
        }

        public async Task<CertificateHistory?> GetById(int id)
        {
            return await _repository.GetById(id);
        }

        public async Task Add(CertificateHistory certificateHistory)
        {
            await _repository.Add(certificateHistory);
        }

        public async Task Update(CertificateHistory certificateHistory, byte[]? pdfFile)
        {
            if (pdfFile != null)
            {
                certificateHistory.PdfFile = pdfFile;
            }
            await _repository.Update(certificateHistory);
        }

        public async Task Delete(int id)
        {
            await _repository.Delete(id);
        }

        public async Task<List<CertificateHistory>> GetByEmployee(string registrationNumber)
        {
            return await _dataService.GetCertificateByEmployee(registrationNumber);
        }

        public async Task<List<CertificateHistoryDto>> GetDtosByEmployee(string registrationNumber)
        {
            var entities = await _dataService.GetCertificateByEmployee(registrationNumber);

            return entities.Select(e => new CertificateHistoryDto
            {
                Id = e.CertificateHistoryId,
                RegistrationNumber = e.RegistrationNumber,
                CertificateTypeId = e.CertificateTypeId,
                FileName = e.FileName,
                State = e.State,
                ContentType = e.ContentType,
                FileSize = e.PdfFile?.Length ?? 0,
                CreatedAt = e.CreationDate
            }).ToList();
        }

        public async Task<List<CertificateHistoryDto>> GetDtosAll()
        {
            // Using FromSqlRaw directly through context is still needed for full table scan
            // But we can use the repository's GetAll and keep this simple
            var entities = await _repository.GetAll();

            return entities.Select(e => new CertificateHistoryDto
            {
                Id = e.CertificateHistoryId,
                RegistrationNumber = e.RegistrationNumber,
                CertificateTypeId = e.CertificateTypeId,
                Reference = e.Reference,
                FileName = e.FileName,
                State = e.State,
                ContentType = e.ContentType,
                FileSize = e.PdfFile?.Length ?? 0,
                CreatedAt = e.CreationDate
            }).ToList();
        }

        // Verifier si la reference existe deja
        public async Task<bool> ExistsByReferenceAsync(string reference)
        {
            return await _dataService.ExistsCertificateByReferenceAsync(reference);
        }


    }
}
