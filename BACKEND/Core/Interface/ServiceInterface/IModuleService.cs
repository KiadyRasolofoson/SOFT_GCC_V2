using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Service de gestion des modules/pages de l'application.
    /// Gère la visibilité du menu de navigation et le regroupement des permissions.
    /// </summary>
    public interface IModuleService
    {
        /// <summary>Récupère tous les modules actifs</summary>
        Task<IEnumerable<Module>> GetAllAsync();

        /// <summary>Récupère l'arbre complet des modules (parents + enfants)</summary>
        Task<IEnumerable<Module>> GetAllWithChildrenAsync();

        /// <summary>Récupère un module par son ID</summary>
        Task<Module?> GetByIdAsync(int id);

        /// <summary>Crée un nouveau module</summary>
        Task<Module> CreateAsync(Module module);

        /// <summary>Met à jour un module existant</summary>
        Task<Module> UpdateAsync(Module module);

        /// <summary>Supprime un module (soft delete : state = 0)</summary>
        Task DeleteAsync(int id);

        /// <summary>Récupère les modules assignés à un rôle</summary>
        Task<IEnumerable<Module>> GetModulesByRoleIdAsync(int roleId);

        /// <summary>Met à jour la liste des modules d'un rôle (remplace tout)</summary>
        Task UpdateRoleModulesAsync(int roleId, List<int> moduleIds);

        /// <summary>
        /// Récupère l'arbre des modules visibles pour un utilisateur connecté (menu dynamique).
        /// Interroge Role_Modules → Modules pour déterminer la visibilité.
        /// </summary>
        Task<IEnumerable<Module>> GetMyModulesAsync(int userId);

        /// <summary>
        /// Récupère les modules avec leurs permissions incluses (pour l'UI admin).
        /// </summary>
        Task<IEnumerable<Module>> GetModulesWithPermissionsAsync();
    }
}
