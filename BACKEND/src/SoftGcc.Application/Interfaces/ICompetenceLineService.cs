using SoftGcc.Application.Dtos.EvaluationsDto;

namespace SoftGcc.Application.Interfaces;

/// <summary>Expose les lignes de compétence sous forme aplatie pour la couche présentation.</summary>
public interface ICompetenceLineService
{
    Task<IEnumerable<CompetenceLineSummaryDto>> GetSummariesAsync();
}
