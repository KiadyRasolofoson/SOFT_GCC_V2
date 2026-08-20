using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<Department>> GetAll();
        Task<Department> GetById(int id);
        Task Add(Department department, byte[]? photo);
        Task Update(Department department, byte[]? photo);
        Task Delete(int id);
    }
}
