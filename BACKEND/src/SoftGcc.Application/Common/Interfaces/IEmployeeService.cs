using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
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
