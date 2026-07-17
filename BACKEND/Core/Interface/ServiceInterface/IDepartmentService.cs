using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
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
