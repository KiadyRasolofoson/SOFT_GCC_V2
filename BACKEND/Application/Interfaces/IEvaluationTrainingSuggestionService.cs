using soft_carriere_competence.Application.Common;
using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Gère le catalogue des suggestions de formation rattachées aux questions d'évaluation.</summary>
public interface IEvaluationTrainingSuggestionService
{
    Task<List<TrainingSuggestionResultDto>> GetTrainingSuggestionsByQuestionsAsync(Dictionary<int, int> ratings);

    Task<IEnumerable<TrainingSuggestion>> GetAllTrainingSuggestionsAsync();

    /// <summary>Lève <see cref="Core.Exceptions.NotFoundException"/> si la suggestion n'existe pas.</summary>
    Task<TrainingSuggestion> GetRequiredTrainingSuggestionAsync(int suggestionId);

    Task CreateTrainingSuggestionAsync(TrainingSuggestionCreationDto suggestion);

    Task UpdateTrainingSuggestionAsync(int suggestionId, TrainingSuggestionCreationDto suggestion);

    Task DeleteTrainingSuggestionAsync(int suggestionId);

    Task<PagedResult<TrainingSuggestion>> GetTrainingSuggestionPageAsync(PageRequest page);
}
