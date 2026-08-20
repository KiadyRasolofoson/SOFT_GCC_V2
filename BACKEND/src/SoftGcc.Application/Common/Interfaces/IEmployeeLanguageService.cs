using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IEmployeeLanguageService : ICrudService<EmployeeLanguage>
    {
        Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id);
        Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee);
    }
}
