using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Application.Dtos.History;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.career_plan
{
    public class CertificateHistoryService
    {
        private readonly ICrudRepository<CertificateHistory> _repository;
        private readonly ApplicationDbContext _context;

        public CertificateHistoryService(ICrudRepository<CertificateHistory> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<IEnumerable<CertificateHistory>> GetAll()
        {
            return await _repository.GetAll();
        }

        public async Task<CertificateHistory> GetById(int id)
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
            return await _context.CertificateHistory
                .FromSqlRaw("SELECT * FROM certificate_history WHERE Registration_number = {0}", registrationNumber)
                .ToListAsync();
        }

        public async Task<List<CertificateHistoryDto>> GetDtosByEmployee(string registrationNumber)
        {
            var entities = await _context.CertificateHistory
                .FromSqlRaw("SELECT * FROM certificate_history WHERE Registration_number = {0}", registrationNumber)
                .ToListAsync();

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
            var entities = await _context.CertificateHistory
                .FromSqlRaw("SELECT * FROM certificate_history")
                .ToListAsync();

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
            return await _context.CertificateHistory
                .AnyAsync(c => c.Reference == reference);
        }


    }
}
