namespace SoftGcc.Application.Common.Interfaces
{
    /// <summary>
    /// Interface générique de base pour tous les services métier.
    /// Définit les opérations CRUD standard.
    /// </summary>
    /// <typeparam name="T">Type de l'entité</typeparam>
    public interface IService<T> where T : class
    {
        Task<IEnumerable<T>> GetAll();
        Task<T> GetById(int id);
        Task Add(T entity);
        Task Update(T entity);
        Task Delete(int id);
    }
}
