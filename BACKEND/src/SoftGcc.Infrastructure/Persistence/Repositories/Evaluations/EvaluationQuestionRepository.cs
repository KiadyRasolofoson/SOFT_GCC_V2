using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Interfaces.Evaluations;
using SoftGcc.Infrastructure.Persistence;
using System.Linq.Expressions;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Evaluations
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

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndCompetenceAsync(int evaluationTypeId, int competenceLineId)
        {
            Console.WriteLine($"Recherche des questions par type d'évaluation et compétence : evaluationTypeId={evaluationTypeId}, competenceLineId={competenceLineId}");

            var questions = await _context.evaluationQuestions
                .Where(q => q.evaluationTypeId == evaluationTypeId
                    && q.CompetenceLineId == competenceLineId
                    && q.state == 1)
                .Include(u => u.Position)
                .Include(u => u.EvaluationType)
                .Include(u => u.CompetenceLine)
                .ToListAsync();

            Console.WriteLine($"Nombre de questions trouvées : {questions.Count}");
            return questions;
        }
    }
}
