using SoftGcc.Application.Dtos.EvaluationsDto;

namespace SoftGcc.Application.Interfaces;

/// <summary>Expose les types de réponse disponibles pour composer un questionnaire.</summary>
public interface IResponseTypeService
{
    Task<IEnumerable<ResponseTypeSummaryDto>> GetSummariesAsync();
}
