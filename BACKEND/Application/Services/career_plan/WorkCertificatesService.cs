using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Infrastructure.Data;

namespace soft_carriere_competence.Application.Services.career_plan
{
    public class WorkCertificatesService
    {
        private readonly ICrudRepository<WorkCertificates> _repository;
        private readonly ApplicationDbContext _context;

        public WorkCertificatesService(ICrudRepository<WorkCertificates> repository, ApplicationDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<IEnumerable<WorkCertificates>> GetAll()
        {
            return await _repository.GetAll();
        }

        public async Task<WorkCertificates> GetById(int id)
        {
            return await _repository.GetById(id);
        }

        public async Task Add(WorkCertificates WorkCertificates)
        {
            await _repository.Add(WorkCertificates);
        }

        public async Task Delete(int id)
        {
            await _repository.Delete(id);
        }
   
        //Avoir une cartification par son token
        public async Task<WorkCertificates?> GetValidCertificateByToken(string token)
        {
            return await _context.WorkCertificates
                .FirstOrDefaultAsync(c =>
                    c.Token == token
                );
        }

        //Verification d'existence d'une certification par son token
        public async Task<bool> IsExist(string token)
        {
            return await _context.WorkCertificates.AnyAsync(c => c.Token == token);
        }
    }
}
