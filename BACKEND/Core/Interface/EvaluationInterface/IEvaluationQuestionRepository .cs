using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Core.Interface.EvaluationInterface
{
    public interface IEvaluationQuestionRepository 
    {
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypeAndPostAsync(int evaluationTypeId, int postId);
        Task<bool> ExistsAsync(int questionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByPositionAsync(int positionId);
        Task<IEnumerable<EvaluationQuestion>> GetQuestionsByEvaluationTypePositionAndCompetenceAsync(int evaluationTypeId, int positionId, int competenceLineId);
    }
}
