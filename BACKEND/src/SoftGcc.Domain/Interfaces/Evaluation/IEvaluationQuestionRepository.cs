using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Domain.Interfaces.Evaluations
{
    public interface IEvaluationQuestionRepository 
    {
        /// <summary>
        /// Recherche pilotée par le référentiel de compétences (domaine → famille → compétence),
        /// le poste restant un filtre facultatif.
        /// </summary>
        Task<IEnumerable<EvaluationQuestion>> FindAsync(EvaluationQuestionQuery query);

        /// <summary>Questions de la banque portant sur l'une des compétences fournies.</summary>
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsBySkillIdsAsync(
            IReadOnlyCollection<int> skillIds,
            int? evaluationTypeId);

        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndPostAsync(int evaluationTypeId, int postId);
        Task<bool> ExistsAsync(int questionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByPositionAsync(int positionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndCompetenceAsync(int evaluationTypeId, int competenceLineId);
    }
}
