using System.Linq.Expressions;

namespace soft_carriere_competence.Core.Interface
{
    public interface IGenericRepository<T> where T : class
    {
        // Crée une entité
        Task CreateAsync(T entity);

        // Récupère toutes les entités
        Task<IEnumerable<T>> GetAllAsync();

        // Met à jour une entité
        Task UpdateAsync(T entity);

        // Supprime une entité
        Task DeleteAsync(T entity);

        // Récupère une entité par son identifiant
        Task<T> GetByIdAsync(int id);

        // Récupère toutes les entités avec des propriétés de navigation
        Task<IEnumerable<T>> GetAllWithIncludesAsync(string includeProperties = "");

        // Récupère une page d'entités avec des propriétés de navigation et filtre par ID
        Task<IEnumerable<T>> GetPageByIdAsync(int id, int pageNumber, int pageSize, string includeProperties = "", string idPropertyName = "");

        // Récupère une page d'entités avec des propriétés de navigation
        IEnumerable<T> GetPage(int pageNumber, int pageSize, string includeProperties = "");

        Task<T> GetFirstOrDefaultAsync(Expression<Func<T, bool>> predicate, params Expression<Func<T, object>>[] includes);


        // Calcule le nombre total de pages pour une taille de page donnée
        int GetTotalPages(int pageSize);

        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    }
}
