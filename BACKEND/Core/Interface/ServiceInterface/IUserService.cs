using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service User.
    /// </summary>
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAll();
        Task<User?> GetById(int id);
        Task<User?> GetByEmail(string email);
        Task Add(User user);
        Task Update(User user);
        Task Delete(int id);
        Task<bool> EmailExists(string email);
    }
}
