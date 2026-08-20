using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    public interface IEmployeeLanguageService : ICrudService<EmployeeLanguage>
    {
        Task<VEmployeeLanguage?> GetEmployeeLanguageById(int id);
        Task<List<VEmployeeLanguage>> GetEmployeeLanguages(int idEmployee);
    }
}
