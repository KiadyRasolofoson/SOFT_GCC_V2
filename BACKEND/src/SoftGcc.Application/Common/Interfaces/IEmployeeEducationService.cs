using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
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
