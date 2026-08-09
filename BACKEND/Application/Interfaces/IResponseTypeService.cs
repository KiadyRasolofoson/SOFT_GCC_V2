using soft_carriere_competence.Application.Dtos.EvaluationsDto;

namespace soft_carriere_competence.Application.Interfaces;

/// <summary>Expose les types de réponse disponibles pour composer un questionnaire.</summary>
public interface IResponseTypeService
{
    Task<IEnumerable<ResponseTypeSummaryDto>> GetSummariesAsync();
}
