using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Gère les réponses saisies par le salarié pendant une session d'évaluation.</summary>
public interface IEvaluationResponseService
{
    Task<EvaluationResponses> SaveResponseAsync(int evaluationId, EvaluationResponseDto responseDto);

    Task<List<EvaluationResponses>> GetResponsesAsync(int evaluationId);

    /// <summary>Lève <see cref="Core.Exceptions.NotFoundException"/> si la réponse n'existe pas.</summary>
    Task<EvaluationResponses> GetRequiredResponseAsync(int evaluationId, int questionId);

    Task<bool> UpdateResponseAsync(int responseId, EvaluationResponseDto responseDto);

    Task<bool> DeleteResponseAsync(int responseId);

    Task<Dictionary<int, List<EvaluationQuestionOptions>>> GetAllQuestionOptionsAsync(int evaluationId);

    Task SaveProgressAsync(int evaluationId, EvaluationProgressDto progress);

    Task<TimeSpan> GetTimeRemainingAsync(int evaluationId);

    Task<bool> ProcessResponsesAfterSubmissionAsync(int evaluationId);
}
