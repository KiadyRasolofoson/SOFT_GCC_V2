using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Enums;
using SoftGcc.Domain.Interfaces;
using SoftGcc.Domain.Interfaces.Data;

namespace SoftGcc.Application.Services.Evaluations
{
    public class EvaluationPortalService
    {
        private readonly IEvaluationDataService _dataService;
        private readonly IGenericRepository<EvaluationProgress> _progressRepository;
        private readonly IGenericRepository<Evaluation> _evaluationRepository;

        public EvaluationPortalService(
            IEvaluationDataService dataService,
            IGenericRepository<EvaluationProgress> progressRepository,
            IGenericRepository<Evaluation> evaluationRepository)
        {
            _dataService = dataService;
            _progressRepository = progressRepository;
            _evaluationRepository = evaluationRepository;
        }

        /// Récupère la liste des évaluations en cours avec les employés associés
        public async Task<IEnumerable<VEmployeesOngoingEvaluation>> GetOngoingEvaluationsAsync()
        {
            return _dataService.GetOngoingEvaluationsQuery()
                .Where(e => e.EvaluationState == 1)
                .ToList();
        }

        /// Récupère la progression d'une évaluation pour un employé donné
        public async Task<EvaluationProgress?> GetEvaluationProgressAsync(int evaluationId, int employeeId)
        {
            return await _progressRepository
                .GetFirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);
        }

        /// Met à jour la progression d'une évaluation
        public async Task<bool> UpdateEvaluationProgressAsync(int evaluationId, int employeeId, int answeredQuestions)
        {
            var progress = await _progressRepository
                .GetFirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);

            if (progress == null) return false;
            progress.answeredQuestions = answeredQuestions;
            progress.progressPercentage = ((decimal)answeredQuestions / progress.totalQuestions * 100);
            progress.lastUpdate = DateTime.UtcNow;

            await _progressRepository.UpdateAsync(progress);
            return true;
        }

        /// Récupère la liste des employés avec leur progression d'évaluation
        public async Task<IEnumerable<VEmployeeEvaluationProgress>> GetEmployeesEvaluationProgressAsync()
        {
            return _dataService.GetEmployeesEvaluationProgressQuery().ToList();
        }

        /// Finalise une évaluation lorsqu'elle est complétée
        public async Task<bool> FinalizeEvaluationAsync(int evaluationId, int employeeId)
        {
            var progress = await _progressRepository
                .GetFirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);

            if (progress == null || progress.progressPercentage < 100) return false;

            var evaluation = await _evaluationRepository.GetByIdAsync(evaluationId);
            if (evaluation == null) return false;

            if (evaluation.state >= (int)EvaluationStatus.Terminee)
                return true;

            evaluation.state = 10;
            await _evaluationRepository.UpdateAsync(evaluation);
            return true;
        }
    }
}
