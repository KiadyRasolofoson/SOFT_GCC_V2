using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;
using soft_carriere_competence.Core.Entities.crud_career;

namespace soft_carriere_competence.Core.Interface.ServiceInterface
{
    /// <summary>
    /// Interface du service d'évaluations.
    /// </summary>
    public interface IEvaluationService
    {
        // Questions
        Task<bool> CreateEvaluationQuestionAsync(EvaluationQuestion question);
        Task<IEnumerable<EvaluationQuestion>> GetAllEvaluationQuestionsAsync();
        Task<EvaluationQuestion> GetEvaluationQuestionByIdAsync(int id);
        Task<bool> UpdateEvaluationQuestionAsync(EvaluationQuestion question);
        Task<bool> DeleteEvaluationQuestionAsync(int id);
        Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsAsync(int evaluationTypeId, int positionId);
        Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsByTypePositionAndCompetenceAsync(
            int evaluationTypeId, int positionId, int competenceLineId);
        Task<IEnumerable<EvaluationQuestion>> GetEvaluationQuestionsByTypeAndCompetenceAsync(
            int evaluationTypeId, int competenceLineId);

        // Types
        Task<IEnumerable<EvaluationType>> GetEvaluationTypeAsync();
        Task<Evaluation?> GetEvaluationByIdAsync(int id);
        Task<IEnumerable<Position>> GetPostesAsync();

        // Evaluation results
        Task<bool> SaveEvaluationResultsAsync(EvaluationResultsDto dto);
        double CalculateAverageRating(Dictionary<int, int> ratings);
        Task<bool> ValidateEvaluationAsync(int evaluationId, bool isServiceApproved, bool isDgApproved,
            DateTime? serviceApprovalDate, DateTime? dgApprovalDate);

        // Training
        Task<List<TrainingSuggestionResultDto>> GetTrainingSuggestionsByQuestionsAsync(Dictionary<int, int> ratings);
        Task<bool> CreateTrainingSuggestionAsync(TrainingSuggestion suggestion);
    }
}
