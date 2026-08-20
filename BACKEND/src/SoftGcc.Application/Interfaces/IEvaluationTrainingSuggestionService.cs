using SoftGcc.Application.Common;
using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Application.Interfaces;

/// <summary>Gère le catalogue des suggestions de formation rattachées aux questions d'évaluation.</summary>
public interface IEvaluationTrainingSuggestionService
{
    Task<List<TrainingSuggestionResultDto>> GetTrainingSuggestionsByQuestionsAsync(Dictionary<int, int> ratings);

    Task<IEnumerable<TrainingSuggestion>> GetAllTrainingSuggestionsAsync();

    /// <summary>Lève <see cref="SoftGcc.Domain.Exceptions.NotFoundException"/> si la suggestion n'existe pas.</summary>
    Task<TrainingSuggestion> GetRequiredTrainingSuggestionAsync(int suggestionId);

    Task CreateTrainingSuggestionAsync(TrainingSuggestionCreationDto suggestion);

    Task UpdateTrainingSuggestionAsync(int suggestionId, TrainingSuggestionCreationDto suggestion);

    Task DeleteTrainingSuggestionAsync(int suggestionId);

    Task<PagedResult<TrainingSuggestion>> GetTrainingSuggestionPageAsync(PageRequest page);
}
