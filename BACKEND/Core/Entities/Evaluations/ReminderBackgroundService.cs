using soft_carriere_competence.Application.Services.Evaluations;

namespace soft_carriere_competence.Core.Entities.Evaluations
{
    public class ReminderBackgroundService: BackgroundService
    {
        private readonly EvaluationService _evaluationService;

        public ReminderBackgroundService(EvaluationService evaluationService)
        {
            _evaluationService = evaluationService;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await _evaluationService.SendAutomaticRemindersAsync();
                await Task.Delay(TimeSpan.FromDays(1), stoppingToken); // Run daily
            }
        }
    }
}
