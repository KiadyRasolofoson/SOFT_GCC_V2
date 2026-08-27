using Microsoft.EntityFrameworkCore;
using SoftGcc.Domain.Entities.Evaluations;
using SoftGcc.Domain.Interfaces.Evaluations;
using SoftGcc.Infrastructure.Persistence;

namespace SoftGcc.Infrastructure.Persistence.Repositories.Evaluations
{
    public class EvaluationQuestionRepository: IEvaluationQuestionRepository
    {
        private readonly ApplicationDbContext _context;
        public EvaluationQuestionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<EvaluationQuestion>> FindAsync(EvaluationQuestionQuery query)
        {
            ArgumentNullException.ThrowIfNull(query);

            var questions = WithReferences();

            if (query.EvaluationTypeId is > 0)
            {
                questions = questions.Where(q => q.evaluationTypeId == query.EvaluationTypeId.Value);
            }

            if (query.SkillId is > 0)
            {
                questions = questions.Where(q => q.SkillId == query.SkillId.Value);
            }

            if (query.FamilyId is > 0)
            {
                questions = questions.Where(q => q.Skill != null && q.Skill.FamilyId == query.FamilyId.Value);
            }

            if (query.DomainId is > 0)
            {
                questions = questions.Where(q =>
                    q.Skill != null && q.Skill.Family.DomainSkillId == query.DomainId.Value);
            }

            if (query.PositionId is > 0)
            {
                questions = questions.Where(q => q.positionId == query.PositionId.Value);
            }

            if (query.CompetenceLineId is > 0)
            {
                questions = questions.Where(q => q.CompetenceLineId == query.CompetenceLineId.Value);
            }

            if (query.ActiveOnly)
            {
                questions = questions.Where(q => q.state == 1);
            }

            return await questions.ToListAsync();
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsBySkillIdsAsync(
            IReadOnlyCollection<int> skillIds,
            int? evaluationTypeId)
        {
            if (skillIds is null || skillIds.Count == 0)
            {
                return Array.Empty<EvaluationQuestion>();
            }

            var ids = skillIds.Where(id => id > 0).Distinct().ToList();
            if (ids.Count == 0)
            {
                return Array.Empty<EvaluationQuestion>();
            }

            var questions = WithReferences()
                .Where(q => q.state == 1 && q.SkillId != null && ids.Contains(q.SkillId.Value));

            if (evaluationTypeId is > 0)
            {
                questions = questions.Where(q => q.evaluationTypeId == evaluationTypeId.Value);
            }

            return await questions.ToListAsync();
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndPostAsync(int evaluationTypeId, int positionId)
        {
            return await FindAsync(new EvaluationQuestionQuery(
                EvaluationTypeId: evaluationTypeId,
                PositionId: positionId));
        }

        public async Task<bool> ExistsAsync(int questionId)
        {
            return await _context.evaluationQuestions.AnyAsync(q => q.questionId == questionId);
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByPositionAsync(int positionId)
        {
            return await FindAsync(new EvaluationQuestionQuery(PositionId: positionId));
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId)
        {
            return await FindAsync(new EvaluationQuestionQuery(
                EvaluationTypeId: evaluationTypeId,
                PositionId: positionId,
                CompetenceLineId: competenceLineId,
                ActiveOnly: true));
        }

        public async Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndCompetenceAsync(int evaluationTypeId, int competenceLineId)
        {
            return await FindAsync(new EvaluationQuestionQuery(
                EvaluationTypeId: evaluationTypeId,
                CompetenceLineId: competenceLineId,
                ActiveOnly: true));
        }

        /// <summary>
        /// La chaîne Skill → Skill_family → Domain_skill porte le domaine et la famille
        /// affichés partout dans le module (listes, planification, notation).
        /// </summary>
        private IQueryable<EvaluationQuestion> WithReferences() =>
            _context.evaluationQuestions
                .Include(q => q.EvaluationType)
                .Include(q => q.Position)
                .Include(q => q.CompetenceLine)
                .Include(q => q.ResponseType)
                .Include(q => q.Skill)
                    .ThenInclude(s => s!.Family)
                        .ThenInclude(f => f.Domain);
    }
}
