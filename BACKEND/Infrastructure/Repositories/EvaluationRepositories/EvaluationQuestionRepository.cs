using Microsoft.EntityFrameworkCore;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Interface.EvaluationInterface;
using soft_carriere_competence.Infrastructure.Data;
using System.Linq.Expressions;

namespace soft_carriere_competence.Infrastructure.Repositories.EvaluationRepositories
{
    public class EvaluationQuestionRepository: IEvaluationQuestionRepository
    {
        private readonly ApplicationDbContext _context;
        public EvaluationQuestionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndPostAsync(int evaluationTypeId, int positionId)
        {
            Console.WriteLine("Avant la fonction getEvaluationTypeAndPost");
            return await _context.evaluationQuestions
                .Where(q => q.evaluationTypeId == evaluationTypeId && q.positionId == positionId)
                .Include(u => u.Position)
                .Include(u => u.EvaluationType)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(int questionId)
        {
            return await _context.evaluationQuestions.AnyAsync(q => q.questionId == questionId);
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByPositionAsync(int positionId)
        {
            return await _context.evaluationQuestions
                .Where(q => q.positionId == positionId)
                .Include(u => u.Position)
                .Include(u => u.EvaluationType)
                .ToListAsync();
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId)
        {
            Console.WriteLine($"Recherche des questions avec les paramètres : evaluationTypeId={evaluationTypeId}, positionId={positionId}, competenceLineId={competenceLineId}");
            
            // Filtrer strictement par ligne de compétence
            var questions = await _context.evaluationQuestions
                .Where(q => q.evaluationTypeId == evaluationTypeId 
                    && q.positionId == positionId 
                    && q.CompetenceLineId == competenceLineId
                    && q.state == 1)
                .Include(u => u.Position)
                .Include(u => u.EvaluationType)
                .Include(u => u.CompetenceLine)
                .ToListAsync();
            
            Console.WriteLine($"Nombre de questions trouvées avec tous les filtres : {questions.Count}");
            
            // Ne pas renvoyer de questions si aucune ne correspond exactement à la ligne de compétence
            return questions;
        }
    }
}
