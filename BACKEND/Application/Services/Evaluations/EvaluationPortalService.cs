using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace soft_carriere_competence.Application.Services.Evaluations
{
    public class EvaluationPortalService
    {
        private readonly ApplicationDbContext _context;

        public EvaluationPortalService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// Récupère la liste des évaluations en cours avec les employés associés
        public async Task<IEnumerable<VEmployeesOngoingEvaluation>> GetOngoingEvaluationsAsync()
        {
            return await _context.vEmployeesOngoingEvaluations
                .Where(e => e.EvaluationState == 1) // Filtre les évaluations en cours (exemple d'état)
                .ToListAsync();
        }

        /// Récupère la progression d'une évaluation pour un employé donné
        public async Task<EvaluationProgress?> GetEvaluationProgressAsync(int evaluationId, int employeeId)
        {
            return await _context.evaluationProgresses
                .FirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);
        }

        /// Met à jour la progression d'une évaluation
        public async Task<bool> UpdateEvaluationProgressAsync(int evaluationId, int employeeId, int answeredQuestions)
        {
            var progress = await _context.evaluationProgresses
                .FirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);

            if (progress == null) return false;
            progress.answeredQuestions = answeredQuestions;
            progress.progressPercentage = ((decimal)answeredQuestions / progress.totalQuestions * 100);
            progress.lastUpdate = DateTime.UtcNow;

            _context.evaluationProgresses.Update(progress);
            await _context.SaveChangesAsync();
            return true;
        }

        /// Récupère la liste des employés avec leur progression d'évaluation
        public async Task<IEnumerable<VEmployeeEvaluationProgress>> GetEmployeesEvaluationProgressAsync()
        {
            return await _context.vEmployeesEvaluationProgress.ToListAsync();
        }

        /// Finalise une évaluation lorsqu'elle est complétée
        public async Task<bool> FinalizeEvaluationAsync(int evaluationId, int employeeId)
        {
            var progress = await _context.evaluationProgresses
                .FirstOrDefaultAsync(ep => ep.evaluationId == evaluationId && ep.employeeId == employeeId);

            if (progress == null || progress.progressPercentage < 100) return false;

            var evaluation = await _context.Evaluations.FindAsync(evaluationId);
            if (evaluation == null) return false;

            evaluation.state = 10; // Exemple de statut
            _context.Evaluations.Update(evaluation);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
