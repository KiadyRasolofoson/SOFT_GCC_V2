using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SoftGcc.Application.Common.Interfaces;

using SoftGcc.Application.Authorization;
namespace SoftGcc.Api.Controllers.employeeSync
{
    /// <summary>
    /// Contrôleur pour la synchronisation manuelle p_sw → Soft_GCC
    /// (T_SAL + T_HST_* InfoEnCours=1 → Employee / Career_plan / référentiels).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [RequirePermission("MANAGE_EMPLOYEE_SYNC", "MANAGE_EMPLOYEES", "MANAGE_PERMISSIONS")]
    public class EmployeeSyncController : ControllerBase
    {
        private readonly IEmployeeSyncService _employeeSyncService;

        public EmployeeSyncController(IEmployeeSyncService employeeSyncService)
        {
            _employeeSyncService = employeeSyncService;
        }

        /// <summary>
        /// Déclenche manuellement la synchronisation complète des employés.
        /// </summary>
        [HttpPost("run")]
        public async Task<IActionResult> RunSync()
        {
            var result = await _employeeSyncService.SyncFromTSalAsync();
            return Ok(new
            {
                message = "Synchronisation terminée (T_SAL + organisation HST)",
                status = result.Status,
                recordsInserted = result.RecordsInserted,
                recordsUpdated = result.RecordsUpdated,
                recordsFailed = result.RecordsFailed,
                syncDate = result.SyncDate,
                error = result.ErrorMessage
            });
        }

        /// <summary>
        /// Récupère l'historique des synchronisations.
        /// </summary>
        [HttpGet("logs")]
        public async Task<IActionResult> GetLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var logs = await _employeeSyncService.GetSyncLogsAsync(page, pageSize);
            return Ok(logs);
        }
    }
}
