using SoftGcc.Application.Common;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Application.Interfaces;

/// <summary>Gère le référentiel des questions d'évaluation.</summary>
public interface IEvaluationQuestionService
{
    Task<EvaluationQuestionCreatedDto> CreateQuestionAsync(EvaluationQuestionDto question);

    Task UpdateQuestionAsync(int questionId, EvaluationQuestionDto question);

    Task DeleteQuestionAsync(int questionId);

    Task<IReadOnlyList<EvaluationQuestionOptionDto>> GetQuestionOptionsAsync(int questionId);

    Task<IReadOnlyList<object>> GetQuestionOptionSummariesAsync();

    /// <summary>Lève <see cref="SoftGcc.Domain.Exceptions.NotFoundException"/> si la question n'existe pas.</summary>
    Task<EvaluationQuestion> GetRequiredQuestionAsync(int questionId);

    Task<IEnumerable<EvaluationQuestion>> GetAllEvaluationQuestionsAsync();

    Task<IEnumerable<EvaluationQuestion>> FindQuestionsAsync(EvaluationQuestionFilterDto filter);

    Task<PagedResult<EvaluationQuestionSummaryDto>> GetQuestionSummariesAsync(PageRequest page);

    Task<PagedResult<EvaluationQuestion>> GetQuestionsByTypeAsync(int evaluationTypeId, PageRequest page);

    Task<IEnumerable<object>> GetQuestionsByEvaluationTypeAsync(int evaluationTypeId);

    Task UpdateQuestionsTimeAsync(List<QuestionTimeUpdateDto> questions);
}
