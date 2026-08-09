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
        /// Les parents sont auto-inclus comme conteneurs si au moins un enfant est assigné.
        /// </summary>
        Task<IEnumerable<Module>> GetMyModulesAsync(int userId);

        /// <summary>
        /// Carte d'accès : routes autorisées pour l'utilisateur + catalogue de toutes les routes modules.
        /// Sert au garde de navigation (blocage URL directe).
        /// </summary>
        Task<(List<string> AllowedRoutes, List<string> CatalogRoutes)> GetAccessMapAsync(int userId);

        /// <summary>
        /// Récupère les modules racines avec leurs permissions et enfants (pour l'UI admin).
        /// </summary>
        Task<IEnumerable<Module>> GetModulesWithPermissionsAsync();

        /// <summary>
        /// Met à jour l'ordre d'affichage (et éventuellement le parent) d'un lot de modules.
        /// Réordre prévu entre frères (même niveau).
        /// </summary>
        Task ReorderModulesAsync(List<ModuleReorderItem> items);
    }

    /// <summary>Élément de réordonnancement d'un module</summary>
    public class ModuleReorderItem
    {
        [System.Text.Json.Serialization.JsonPropertyName("moduleId")]
        public int ModuleId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("sortOrder")]
        public int SortOrder { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("parentModuleId")]
        public int? ParentModuleId { get; set; }
    }
}
