using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    public interface IEmployeeEducationService
    {
        Task<IEnumerable<EmployeeEducation>> GetAll();
        Task<EmployeeEducation> GetById(int id);
        Task Add(EmployeeEducation education);
        Task Update(EmployeeEducation education);
        Task Delete(int id);
        Task<List<VEmployeeEducation>> GetEmployeeEducations(int idEmployee);
        Task<VEmployeeEducation?> GetEmployeeEducationById(int idEmployeeEducation);
    }
}
