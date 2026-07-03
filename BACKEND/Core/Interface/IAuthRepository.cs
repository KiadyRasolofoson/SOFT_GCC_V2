using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface
{
    public interface IAuthRepository
    {

        Task<Employee> GetUserByEmailAsync(string email);
        Task<Employee> GetUserByIdAsync(int id);
        Task AddUserAsync(Employee user);
        Task SaveChangesAsync();
    }
}
