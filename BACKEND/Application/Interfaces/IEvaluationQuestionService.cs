using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Gère le référentiel des questions d'évaluation.</summary>
public interface IEvaluationQuestionService
{
    Task<EvaluationQuestionCreatedDto> CreateQuestionAsync(EvaluationQuestionDto question);

    Task UpdateQuestionAsync(int questionId, EvaluationQuestionDto question);

    Task DeleteQuestionAsync(int questionId);

    /// <summary>Lève <see cref="Core.Exceptions.NotFoundException"/> si la question n'existe pas.</summary>
    Task<EvaluationQuestion> GetRequiredQuestionAsync(int questionId);

    Task<IEnumerable<EvaluationQuestion>> GetAllEvaluationQuestionsAsync();

    Task<IEnumerable<EvaluationQuestion>> FindQuestionsAsync(EvaluationQuestionFilterDto filter);

    Task<PagedResult<EvaluationQuestionSummaryDto>> GetQuestionSummariesAsync(PageRequest page);

    Task<PagedResult<EvaluationQuestion>> GetQuestionsByTypeAsync(int evaluationTypeId, PageRequest page);

    Task<IEnumerable<object>> GetQuestionsByEvaluationTypeAsync(int evaluationTypeId);

    Task UpdateQuestionsTimeAsync(List<QuestionTimeUpdateDto> questions);
}
