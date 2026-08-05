using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using soft_carriere_competence.Core.Interface.ServiceInterface;

namespace soft_carriere_competence.Controllers.employeeSync
{
    /// <summary>
    /// Contrôleur pour la synchronisation manuelle T_SAL (p_sw) → Employee (Soft_GCC).
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "RequireAdminRole")]
    public class EmployeeSyncController : ControllerBase
    {
        private readonly IEmployeeSyncService _employeeSyncService;

        public EmployeeSyncController(IEmployeeSyncService employeeSyncService)
        {
            _employeeSyncService = employeeSyncService;
        }

        /// <summary>
        /// Déclenche manuellement la synchronisation T_SAL → Employee.
        /// </summary>
        [HttpPost("run")]
        public async Task<IActionResult> RunSync()
        {
            var result = await _employeeSyncService.SyncFromTSalAsync();
            return Ok(new
            {
                message = "Synchronisation terminée",
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
