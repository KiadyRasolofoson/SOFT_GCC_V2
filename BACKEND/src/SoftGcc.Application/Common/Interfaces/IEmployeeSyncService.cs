using SoftGcc.Domain.Entities.salary_skills;

namespace SoftGcc.Application.Common.Interfaces
{
    /// <summary>
    /// Synchronisation p_sw → Soft_GCC : T_SAL + T_HST_* (InfoEnCours = 1) + référentiels.
    /// </summary>
    public interface IEmployeeSyncService
    {
        /// <summary>
        /// Synchronise les employés depuis p_sw (identité, département, poste, établissement,
        /// date d'embauche, manager, Career_plan courant) vers Soft_GCC.
        /// Correspondance : Registration_number = MatriculeSalarie.
        /// </summary>
        Task<SyncLog> SyncFromTSalAsync();

        /// <summary>
        /// Récupère l'historique des synchronisations.
        /// </summary>
        Task<IEnumerable<SyncLog>> GetSyncLogsAsync(int page = 1, int pageSize = 20);
    }
}
