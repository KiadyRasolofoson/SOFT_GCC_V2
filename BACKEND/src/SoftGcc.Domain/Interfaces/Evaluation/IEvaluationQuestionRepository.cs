using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Domain.Interfaces.Evaluations
{
    public interface IEvaluationQuestionRepository 
    {
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndPostAsync(int evaluationTypeId, int postId);
        Task<bool> ExistsAsync(int questionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByPositionAsync(int positionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndCompetenceAsync(int evaluationTypeId, int competenceLineId);
    }
}
