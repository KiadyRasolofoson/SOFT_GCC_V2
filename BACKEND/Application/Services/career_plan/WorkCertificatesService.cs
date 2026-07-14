using soft_carriere_competence.Core.Entities.career_plan;
using soft_carriere_competence.Core.Interface;
using soft_carriere_competence.Core.Interface.DataService;

namespace soft_carriere_competence.Application.Services.career_plan
{
    public class WorkCertificatesService
    {
        private readonly IGenericRepository<WorkCertificates> _repository;
        private readonly ICareerPlanDataService _dataService;

        public WorkCertificatesService(IGenericRepository<WorkCertificates> repository, ICareerPlanDataService dataService)
        {
            _repository = repository;
            _dataService = dataService;
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
   
        public async Task<WorkCertificates?> GetValidCertificateByToken(string token)
        {
            return await _dataService.GetValidCertificateByToken(token);
        }

        public async Task<bool> IsExist(string token)
        {
            return await _dataService.IsWorkCertificateExist(token);
        }
    }
}
