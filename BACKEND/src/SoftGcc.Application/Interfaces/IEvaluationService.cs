using SoftGcc.Application.Dtos.EvaluationsDto;
using SoftGcc.Domain.Entities.crud_career;
using SoftGcc.Domain.Entities.Evaluations;

namespace SoftGcc.Application.Interfaces;

/// <summary>Pilote le cycle de vie d'une évaluation : consultation, notation, soumission, validation.</summary>
public interface IEvaluationService
{
    /// <summary>Lève <see cref="SoftGcc.Domain.Exceptions.NotFoundException"/> si l'évaluation n'existe pas.</summary>
    Task<object> GetRequiredEvaluationDetailsAsync(int evaluationId);

    Task<IEnumerable<EvaluationType>> GetEvaluationTypeAsync();

    Task<IEnumerable<Position>> GetPostesAsync();

    Task<IEnumerable<object>> GetEvaluationTemplatesAsync();

    Task<IEnumerable<object>> GetSelectedQuestionsAndResponsesAsync(int evaluationId);

    /// <summary>
    /// Questions proposées à la planification pour un poste : compétences de la matrice
    /// puis banque de questions, enrichies du domaine et de la famille.
    /// </summary>
    Task<IReadOnlyList<PlanningQuestionDto>> GetPlanningQuestionsAsync(
        int evaluationTypeId,
        int positionId,
        int? competenceLineId = null);

    double CalculateAverageRating(Dictionary<int, int> ratings);

    Task<bool> SaveEvaluationResultsAsync(EvaluationResultsDto dto);

    Task<bool> ValidateEvaluationAsync(EvaluationValidationDto validation);

    Task SubmitEvaluationAsync(int evaluationId, EvaluationSubmissionDto submission);
}
