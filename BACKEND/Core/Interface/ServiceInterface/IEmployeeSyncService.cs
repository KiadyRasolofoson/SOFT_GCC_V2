using soft_carriere_competence.Core.Entities.salary_skills;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service de synchronisation T_SAL (p_sw) → Employee (Soft_GCC).
    /// </summary>
    public interface IEmployeeSyncService
    {
        /// <summary>
        /// Synchronise les employés depuis la table T_SAL de p_sw vers la table Employee de Soft_GCC.
        /// La correspondance se fait par Registration_number = MatriculeSalarie.
        /// </summary>
        /// <returns>Le log de synchronisation créé.</returns>
        Task<SyncLog> SyncFromTSalAsync();

        /// <summary>
        /// Récupère l'historique des synchronisations.
        /// </summary>
        Task<IEnumerable<SyncLog>> GetSyncLogsAsync(int page = 1, int pageSize = 20);
    }
}
