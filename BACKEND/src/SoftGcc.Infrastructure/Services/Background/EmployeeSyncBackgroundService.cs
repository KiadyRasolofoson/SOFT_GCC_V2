using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SoftGcc.Application.Common.Interfaces;

namespace SoftGcc.Infrastructure.Services.Background
{
    /// <summary>
    /// Service d'arrière-plan qui exécute la synchronisation complète p_sw → Soft_GCC une fois par jour.
    /// </summary>
    public class EmployeeSyncBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EmployeeSyncBackgroundService> _logger;
        private readonly TimeSpan _syncTime = new(3, 0, 0); // 03:00 AM

        public EmployeeSyncBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<EmployeeSyncBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[EmployeeSync BG] Service démarré — synchro planifiée à {Time} chaque jour", _syncTime);

            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;
                var nextRun = DateTime.Today.Add(_syncTime);
                if (now > nextRun)
                    nextRun = nextRun.AddDays(1);

                var delay = nextRun - now;
                _logger.LogInformation("[EmployeeSync BG] Prochaine synchro dans {Delay}", delay);

                try
                {
                    await Task.Delay(delay, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                await RunSyncAsync();
            }
        }

        private async Task RunSyncAsync()
        {
            _logger.LogInformation("[EmployeeSync BG] Démarrage de la synchronisation planifiée...");

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<IEmployeeSyncService>();
                var result = await syncService.SyncFromTSalAsync();
                _logger.LogInformation(
                    "[EmployeeSync BG] Synchro terminée — Status: {Status}, Insertions: {Inserted}, MàJ: {Updated}, Échecs: {Failed}",
                    result.Status, result.RecordsInserted, result.RecordsUpdated, result.RecordsFailed);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[EmployeeSync BG] Erreur lors de la synchronisation planifiée");
            }
        }
    }
}
