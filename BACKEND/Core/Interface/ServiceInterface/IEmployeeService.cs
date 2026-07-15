using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service Employee.
    /// </summary>
    public interface IEmployeeService
    {
        Task<IEnumerable<VEmployee>> GetAll();
        Task<Employee> GetById(int id);
        Task Add(Employee employee, byte[]? photo);
        Task Update(Employee employee);
        Task Delete(int id);
        Task<(List<VEmployee> Data, int TotalCount)> GetEmployeeFilter(
            string? keyWord = null,
            string? departmentId = null,
            string? hiringDate1 = null,
            string? hiringDate2 = null,
            int page = 1,
            int pageSize = 10);
        Task SaveImage(ImageEntity imageEntity);
    }
}
