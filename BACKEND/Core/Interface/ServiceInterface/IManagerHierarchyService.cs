namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Service de résolution de la hiérarchie managériale.
    /// Parcourt Employee.ManagerId récursivement pour déterminer les relations manager/subordonné.
    /// </summary>
    public interface IManagerHierarchyService
    {
        /// <summary>
        /// Détermine si un utilisateur (manager) est le manager direct ou indirect d'un employé.
        /// </summary>
        /// <param name="managerUserId">ID de l'utilisateur connecté (table users).</param>
        /// <param name="employeeId">ID de l'employé évalué (table Employee).</param>
        Task<bool> IsManagerOfAsync(int managerUserId, int employeeId);

        /// <summary>
        /// Récupère tous les EmployeeId des subordonnés (directs + indirects, récursif) d'un manager.
        /// </summary>
        /// <param name="managerUserId">ID de l'utilisateur (table users).</param>
        Task<List<int>> GetManagedEmployeeIdsAsync(int managerUserId);

        /// <summary>
        /// Résout le lien User → Employee via la FK EmployeeId.
        /// </summary>
        /// <param name="userId">ID de l'utilisateur (table users).</param>
        /// <returns>EmployeeId correspondant, ou null si aucun lien.</returns>
        Task<int?> GetEmployeeIdForUserAsync(int userId);

        /// <summary>
        /// Récupère le ManagerId direct d'un employé (parent immédiat).
        /// </summary>
        Task<int?> GetDirectManagerIdAsync(int employeeId);

        /// <summary>
        /// Vérifie si un utilisateur a le rôle RH (role_id = 3, basé sur les seeds connus).
        /// </summary>
        Task<bool> IsUserRHAsync(int userId);

        /// <summary>
        /// Vérifie si un utilisateur a le rôle Directeur/DG (role_id = 4).
        /// </summary>
        Task<bool> IsUserDGAsync(int userId);
    }
}
