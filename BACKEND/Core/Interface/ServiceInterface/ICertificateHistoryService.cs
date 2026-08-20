using soft_carriere_competence.Application.Dtos.History;
using soft_carriere_competence.Core.Entities.career_plan;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    public interface ICertificateHistoryService
    {
        Task<IEnumerable<CertificateHistory>> GetAll();
        Task<CertificateHistory> GetById(int id);
        Task Add(CertificateHistory certificateHistory);
        Task Update(CertificateHistory certificateHistory, byte[]? pdfFile);
        Task Delete(int id);
        Task<List<CertificateHistory>> GetByEmployee(string registrationNumber);
        Task<bool> ExistsByReferenceAsync(string reference);
        Task<List<CertificateHistoryDto>> GetDtosByEmployee(string registrationNumber);
        Task<List<CertificateHistoryDto>> GetDtosAll();
    }
}
