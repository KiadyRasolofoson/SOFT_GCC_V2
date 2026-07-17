namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface générique pour les services CRUD standards.
    /// Tous les services qui suivent le pattern GetAll/GetById/Add/Update/Delete l'utilisent.
    /// </summary>
    /// <typeparam name="T">Type de l'entité</typeparam>
    public interface ICrudService<T> where T : class
    {
        Task<IEnumerable<T>> GetAll();
        Task<T> GetById(int id);
        Task Add(T entity);
        Task Update(T entity);
        Task Delete(int id);
    }
}
