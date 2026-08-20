using soft_carriere_competence.Application.Dtos.EvaluationsDto;
using soft_carriere_competence.Core.Entities.crud_career;
using soft_carriere_competence.Core.Entities.Evaluations;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Pilote le cycle de vie d'une évaluation : consultation, notation, soumission, validation.</summary>
public interface IEvaluationService
{
    /// <summary>Lève <see cref="Core.Exceptions.NotFoundException"/> si l'évaluation n'existe pas.</summary>
    Task<object> GetRequiredEvaluationDetailsAsync(int evaluationId);

    Task<IEnumerable<EvaluationType>> GetEvaluationTypeAsync();

    Task<IEnumerable<Position>> GetPostesAsync();

    Task<IEnumerable<object>> GetEvaluationTemplatesAsync();

    Task<IEnumerable<object>> GetSelectedQuestionsAndResponsesAsync(int evaluationId);

    double CalculateAverageRating(Dictionary<int, int> ratings);

    Task<bool> SaveEvaluationResultsAsync(EvaluationResultsDto dto);

    Task<bool> ValidateEvaluationAsync(EvaluationValidationDto validation);

    Task SubmitEvaluationAsync(int evaluationId, EvaluationSubmissionDto submission);
}
